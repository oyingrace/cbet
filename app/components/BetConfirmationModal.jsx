'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useWriteContract, usePublicClient } from 'wagmi';
import { useApp } from '@/lib/context/AppContext';
import BetCalculator from '@/lib/services/betCalculator';
import { walletFetch } from '@/lib/web3/apiClient';
import { erc20Abi } from '@/lib/web3/erc20Abi';
import { lottoAbi } from '@/lib/web3/lottoAbi';
import { usdtToRaw, formatUsdt } from '@/lib/web3/format';
import { getOnChainGameTypeIndex } from '@/lib/utils/gameTypes';
import { generateRoundId } from '@/lib/utils/rounds';
import { USDT_ADDRESS, LOTTO_CONTRACT_ADDRESS } from '@/lib/web3/constants';

/**
 * Confirms and places a bet by staking USDT into the CbetLotto contract.
 *
 * Flow (MiniPay signs each step, gas paid in USDT):
 *   1. approve USDT to the contract if the allowance is short
 *   2. placeBet(drawId, gameType, numbers, amount) — escrows the stake on-chain
 *   3. POST the txHash to /api/bets/place, which verifies the BetPlaced event
 *      on Celo and records the bet.
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
  const [status, setStatus] = useState('idle'); // idle | preparing-gas | approving | staking | recording | error
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
  const busy =
    status === 'preparing-gas' ||
    status === 'approving' ||
    status === 'staking' ||
    status === 'recording';

  const handleConfirm = async () => {
    setErrorMsg(null);

    if (!LOTTO_CONTRACT_ADDRESS) {
      setErrorMsg('The lottery contract is not configured yet.');
      setStatus('error');
      return;
    }
    if (!address || !calc) return;

    const gameType = getOnChainGameTypeIndex(game.type);
    if (gameType === null) {
      setErrorMsg('This game is not supported on-chain yet.');
      setStatus('error');
      return;
    }

    try {
      const amountRaw = usdtToRaw(totalCost);
      if (amountRaw <= 0n) throw new Error('Invalid stake amount');

      // 0. Make sure the wallet has gas. MiniPay wallets often hold only
      // USDT (MiniPay doesn't yet support paying gas in USDT), so the relayer
      // tops up a small amount of CELO if needed before any transaction.
      setStatus('preparing-gas');
      const gasRes = await walletFetch(address, '/api/wallet/ensure-gas', {
        method: 'POST',
        body: JSON.stringify({ walletAddress: address }),
      });
      const gasData = await gasRes.json();
      if (!gasRes.ok || !gasData.success) {
        throw new Error(gasData.error || 'Could not prepare gas for this transaction');
      }

      // 1. Approve USDT to the contract if needed.
      const allowance = await publicClient.readContract({
        address: USDT_ADDRESS,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address, LOTTO_CONTRACT_ADDRESS],
      });

      if (allowance < amountRaw) {
        setStatus('approving');
        const approveHash = await writeContractAsync({
          address: USDT_ADDRESS,
          abi: erc20Abi,
          functionName: 'approve',
          args: [LOTTO_CONTRACT_ADDRESS, amountRaw],
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      // 2. Place the bet on-chain.
      setStatus('staking');
      const drawId = generateRoundId(new Date(), game.type);
      const txHash = await writeContractAsync({
        address: LOTTO_CONTRACT_ADDRESS,
        abi: lottoAbi,
        functionName: 'placeBet',
        args: [drawId, gameType, selectedNumbers.map((n) => Number(n)), amountRaw],
      });
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      // 3. Record the bet (server verifies the BetPlaced event).
      setStatus('recording');
      const res = await walletFetch(address, '/api/bets/place', {
        method: 'POST',
        body: JSON.stringify({
          gameId: game._id,
          numbers: selectedNumbers.map((n) => Number(n)),
          betMode,
          amount: Number(betAmount),
          txHash,
          drawId,
          walletAddress: address,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to record bet');
      }

      await onConfirm?.();
      toast.success('Bet placed! Good luck.');
      router.push('/bets/history');
    } catch (err) {
      console.error('Bet placement failed:', err);
      const message = err?.shortMessage || err?.message || 'Something went wrong';
      setErrorMsg(message);
      setStatus('error');
      toast.error(message);
    }
  };

  const buttonLabel =
    status === 'preparing-gas'
      ? 'Preparing gas…'
      : status === 'approving'
        ? 'Approve in MiniPay…'
        : status === 'staking'
          ? 'Confirm bet in MiniPay…'
          : status === 'recording'
            ? 'Placing bet…'
            : 'Confirm & Pay';

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
          <Row label="Total stake" value={`${formatUsdt(totalCost)} USDT`} highlight />
          <Row label="Potential win" value={`${formatUsdt(potentialWinnings)} USDT`} positive />
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
            {buttonLabel}
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
