'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWriteContract, usePublicClient } from 'wagmi';
import { useApp } from '@/lib/context/AppContext';
import BetCalculator from '@/lib/services/betCalculator';
import { walletFetch } from '@/lib/web3/apiClient';
import { erc20Abi } from '@/lib/web3/erc20Abi';
import { cusdToRaw, formatCusd } from '@/lib/web3/format';
import { CUSD_ADDRESS, TREASURY_ADDRESS } from '@/lib/web3/constants';

/**
 * Confirms and places a bet by staking cUSD to the treasury from MiniPay.
 *
 * Flow: transfer cUSD (MiniPay signs — legacy tx) → wait for the receipt →
 * POST the txHash to /api/bets/place, where the transfer is verified on Celo
 * and the bet is recorded. No PIN and no relayer: MiniPay holds the keys.
 */
const BetConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  game,
  selectedNumbers,
  betAmount,
  betMode = 'total',
}) => {
  const router = useRouter();
  const { address } = useApp();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [status, setStatus] = useState('idle'); // idle | staking | recording | error
  const [errorMsg, setErrorMsg] = useState(null);

  const calc = useMemo(() => {
    if (!game || !selectedNumbers?.length || !betAmount) return null;
    try {
      return BetCalculator.calculateBet({
        selectedNumbers,
        betType: game.type,
        amount: Number(betAmount),
        mode: betMode,
        gameOdds: game.odds,
      });
    } catch {
      return null;
    }
  }, [game, selectedNumbers, betAmount, betMode]);

  if (!isOpen) return null;

  const totalCost = calc?.totalCost ?? Number(betAmount);
  const potentialWinnings = calc?.potentialWinnings ?? 0;
  const busy = status === 'staking' || status === 'recording';

  const handleConfirm = async () => {
    setErrorMsg(null);

    if (!TREASURY_ADDRESS) {
      setErrorMsg('Staking is not configured yet. Please try again later.');
      setStatus('error');
      return;
    }
    if (!address || !calc) return;

    try {
      setStatus('staking');
      const amountRaw = cusdToRaw(totalCost);
      if (amountRaw <= 0n) throw new Error('Invalid stake amount');

      const txHash = await writeContractAsync({
        address: CUSD_ADDRESS,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [TREASURY_ADDRESS, amountRaw],
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });

      setStatus('recording');
      const res = await walletFetch(address, '/api/bets/place', {
        method: 'POST',
        body: JSON.stringify({
          gameId: game._id,
          numbers: selectedNumbers.map((n) => Number(n)),
          betMode,
          amount: Number(betAmount),
          txHash,
          walletAddress: address,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to record bet');
      }

      await onConfirm?.();
      router.push('/bets/history');
    } catch (err) {
      console.error('Bet placement failed:', err);
      setErrorMsg(err?.shortMessage || err?.message || 'Something went wrong');
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white dark:bg-dark-bg-secondary rounded-t-2xl sm:rounded-2xl p-5 shadow-xl">
        <h2 className="text-lg font-bold text-gray-900 dark:text-dark-text-primary mb-4">
          Confirm your bet
        </h2>

        <div className="space-y-3 mb-4">
          <Row label="Game" value={game?.name} />
          <Row label="Numbers" value={selectedNumbers?.join(', ')} />
          {calc?.isPermBet && calc.numberOfCombinations > 1 && (
            <Row label="Combinations" value={String(calc.numberOfCombinations)} />
          )}
          <Row label="Total stake" value={`${formatCusd(totalCost)} cUSD`} highlight />
          <Row
            label="Potential win"
            value={`${formatCusd(potentialWinnings)} cUSD`}
            positive
          />
        </div>

        {errorMsg && (
          <div className="mb-3 rounded-lg bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-sm px-3 py-2">
            {errorMsg}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-3 rounded-lg border border-gray-300 dark:border-dark-bg-primary text-gray-700 dark:text-dark-text-primary font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            className="flex-1 py-3 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-semibold disabled:opacity-60"
          >
            {status === 'staking'
              ? 'Confirm in MiniPay…'
              : status === 'recording'
                ? 'Placing bet…'
                : 'Confirm & Pay'}
          </button>
        </div>
      </div>
    </div>
  );
};

function Row({ label, value, highlight, positive }) {
  return (
    <div className="flex justify-between items-center gap-3">
      <span className="text-sm text-gray-500 dark:text-dark-text-secondary">{label}</span>
      <span
        className={`text-sm font-semibold text-right ${
          positive
            ? 'text-green-600 dark:text-green-500'
            : highlight
              ? 'text-yellow-600 dark:text-yellow-500'
              : 'text-gray-900 dark:text-dark-text-primary'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default BetConfirmationModal;
