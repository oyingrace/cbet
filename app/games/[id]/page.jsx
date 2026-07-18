'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { ChevronLeft } from 'lucide-react';
import Header from '@/components/header';
import Navigation from '@/components/navigation';
import BetConfirmationModal from '@/components/BetConfirmationModal';
import BetCalculator from '@/lib/services/betCalculator';
import { isPermBet } from '@/lib/utils/combinationGenerator';
import { useUsdtWallet } from '@/lib/web3/hooks/useUsdtWallet';
import { getAffordability } from '@/lib/utils/affordability';
import { usdtToRaw, formatUsdt } from '@/lib/web3/format';

const GameDetail = () => {
  const router = useRouter();
  const params = useParams();
  const gameId = params?.id;

  const {
    address: walletAddress,
    balance: usdtBalance,
    balanceRaw,
    isLoading: balanceLoading,
    error: balanceError,
    refresh: refreshBalance,
  } = useUsdtWallet();

  const [game, setGame] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [betAmount, setBetAmount] = useState('');
  const [betMode, setBetMode] = useState('total');
  const [betPreview, setBetPreview] = useState(null);
  const [showCombinations, setShowCombinations] = useState(false);
  const [isRefreshingForBet, setIsRefreshingForBet] = useState(false);

  const totalCostRaw = useMemo(() => {
    if (betPreview?.totalCost != null) return usdtToRaw(betPreview.totalCost);
    const amount = Number(betAmount);
    if (!Number.isFinite(amount) || amount <= 0) return 0n;
    return usdtToRaw(amount);
  }, [betPreview, betAmount]);

  const affordability = useMemo(
    () =>
      getAffordability({
        balanceRaw,
        totalCostRaw,
        balanceLoading: balanceLoading || isRefreshingForBet,
        balanceError,
        walletAddress,
      }),
    [balanceRaw, totalCostRaw, balanceLoading, isRefreshingForBet, balanceError, walletAddress]
  );

  const betValidationError = useMemo(() => {
    if (!game || !betAmount || Number(betAmount) <= 0) return null;
    const validation = BetCalculator.validateBet({
      selectedNumbers,
      betType: game.type,
      amount: Number(betAmount),
      minBetAmount: Number(game.minBetAmount) || 1,
      maxBetAmount: game.maxBetAmount || 1000000,
      mode: betMode,
    });
    return validation.valid ? null : validation.error;
  }, [game, betAmount, selectedNumbers, betMode]);

  useEffect(() => {
    if (!gameId) return;
    const fetchGame = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/games/${gameId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch game');
        setGame(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [gameId]);

  useEffect(() => {
    if (game && selectedNumbers.length > 0 && betAmount && Number(betAmount) > 0) {
      try {
        const preview = BetCalculator.previewBet({
          selectedNumbers,
          betType: game.type,
          amount: Number(betAmount),
          mode: betMode,
          gameOdds: game.odds,
        });
        setBetPreview(preview);
      } catch {
        setBetPreview(null);
      }
    } else {
      setBetPreview(null);
    }
  }, [selectedNumbers, betAmount, betMode, game]);

  const handleNumberClick = (number) => {
    if (!game) return;
    const maxNumbers =
      typeof game.maxNumbers === 'object' ? game.maxNumbers.max : game.maxNumbers;

    if (selectedNumbers.includes(number)) {
      setSelectedNumbers(selectedNumbers.filter((n) => n !== number));
    } else if (selectedNumbers.length < maxNumbers) {
      setSelectedNumbers([...selectedNumbers, number]);
    }
  };

  const handleQuickPick = () => {
    if (!game) return;
    const minNumbers =
      typeof game.minNumbers === 'object' ? game.minNumbers.min : game.minNumbers;
    const maxRange =
      typeof game.numberRange === 'object' ? game.numberRange.max : game.numberRange;
    const minRange = typeof game.numberRange === 'object' ? game.numberRange.min : 1;

    const pool = Array.from({ length: maxRange - minRange + 1 }, (_, i) => i + minRange);
    const picks = [];
    while (picks.length < minNumbers && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      picks.push(pool.splice(idx, 1)[0]);
    }
    setSelectedNumbers(picks.sort((a, b) => a - b));
  };

  const isBetValid = () => {
    if (!game) return false;
    const minNumbers =
      typeof game.minNumbers === 'object' ? game.minNumbers.min : game.minNumbers;
    const maxNumbers =
      typeof game.maxNumbers === 'object' ? game.maxNumbers.max : game.maxNumbers;
    const minBetAmount = Number(game.minBetAmount) || 1;

    const baseValid =
      selectedNumbers.length >= minNumbers &&
      selectedNumbers.length <= maxNumbers &&
      Number(betAmount) > 0 &&
      !betValidationError &&
      affordability.status === 'sufficient';

    if (!baseValid) return false;

    if (isPermBet(game.type) && betPreview) {
      if (betMode === 'total' && betPreview.stakePerLine < minBetAmount) return false;
      if (betMode === 'perLine' && Number(betAmount) < minBetAmount) return false;
    }
    if (!isPermBet(game.type) && Number(betAmount) < minBetAmount) return false;

    return true;
  };

  const getValidationMessage = () => {
    if (!game) return 'Loading game...';
    const minNumbers =
      typeof game.minNumbers === 'object' ? game.minNumbers.min : game.minNumbers;
    const maxNumbers =
      typeof game.maxNumbers === 'object' ? game.maxNumbers.max : game.maxNumbers;
    const minBetAmount = Number(game.minBetAmount) || 1;

    if (selectedNumbers.length < minNumbers) return `Select at least ${minNumbers} numbers`;
    if (selectedNumbers.length > maxNumbers) return `Select at most ${maxNumbers} numbers`;
    if (!betAmount || Number(betAmount) <= 0) return `Enter a valid amount`;

    if (isPermBet(game.type) && betPreview) {
      const combos = betPreview.numberOfCombinations || 1;
      if (betMode === 'total' && betPreview.stakePerLine < minBetAmount) {
        return `Min per line is ${minBetAmount} USDT. With ${combos} lines, min total is ${minBetAmount * combos} USDT`;
      }
      if (betMode === 'perLine' && Number(betAmount) < minBetAmount) {
        return `Stake per line must be at least ${minBetAmount} USDT`;
      }
    } else if (!isPermBet(game.type) && Number(betAmount) < minBetAmount) {
      return `Minimum bet amount is ${minBetAmount} USDT`;
    }

    if (betValidationError) return betValidationError;
    if (affordability.status === 'checking') return 'Checking balance...';
    if (affordability.status === 'error') return affordability.message;
    if (affordability.status === 'insufficient') return affordability.message;
    return null;
  };

  const handlePlayNow = async () => {
    if (!game || !isBetValid()) return;
    try {
      setIsRefreshingForBet(true);
      const fresh = await refreshBalance();
      const freshRaw = fresh?.balanceRaw ?? balanceRaw ?? 0n;
      const freshCheck = getAffordability({
        balanceRaw: freshRaw,
        totalCostRaw,
        balanceLoading: false,
        balanceError: null,
        walletAddress,
      });
      if (freshCheck.status !== 'sufficient') return;
    } catch (e) {
      console.error('Fresh balance check failed:', e);
      return;
    } finally {
      setIsRefreshingForBet(false);
    }
    setShowConfirmation(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-dark-bg-primary">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-dark-bg-primary">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-dark-bg-primary">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-gray-500">Game not found</div>
        </div>
      </div>
    );
  }

  const numberRangeMax =
    typeof game.numberRange === 'object' ? game.numberRange.max : game.numberRange;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-bg-primary">
      <Header />

      <main className="container mx-auto px-4 py-8 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-4 relative">
            <button
              onClick={() => router.push('/games')}
              aria-label="Back to games"
              className="absolute left-0 focus:outline-none"
            >
              <ChevronLeft className="text-gray-700 dark:text-white" size={22} />
            </button>
            <h1 className="text-2xl font-bold dark:text-dark-text-primary text-center">
              {game.name}
            </h1>
          </div>

          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-dark-text-primary">Game Rules</h2>
            <p className="text-gray-600 dark:text-dark-text-secondary mb-4">{game.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <Meta label="Min Numbers" value={typeof game.minNumbers === 'object' ? game.minNumbers.min : game.minNumbers} />
              <Meta label="Max Numbers" value={typeof game.maxNumbers === 'object' ? game.maxNumbers.max : game.maxNumbers} />
              <Meta
                label="Number Range"
                value={
                  typeof game.numberRange === 'object'
                    ? `${game.numberRange.min}-${game.numberRange.max}`
                    : `1-${game.numberRange}`
                }
              />
              <Meta label="Odds" value={`${game.odds}x`} />
            </div>
          </div>

          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold dark:text-dark-text-primary">Select Numbers</h2>
              <button
                type="button"
                onClick={handleQuickPick}
                className="text-sm font-medium text-dream-blue dark:text-dream-yellow hover:underline"
              >
                Quick Pick
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 dark:bg-dark-bg-primary rounded-lg min-h-[60px]">
              <div className="flex flex-wrap gap-2">
                {selectedNumbers.length > 0 ? (
                  selectedNumbers.map((number) => (
                    <div
                      key={number}
                      className="w-10 h-10 rounded-full bg-dream-blue text-white flex items-center justify-center font-medium"
                    >
                      {number}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-dark-text-secondary">No numbers selected</p>
                )}
              </div>
            </div>

            <div className="mb-6 max-h-[300px] overflow-y-auto pr-2">
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: numberRangeMax }, (_, i) => i + 1).map((number) => (
                  <button
                    key={number}
                    onClick={() => handleNumberClick(number)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium transition-colors ${
                      selectedNumbers.includes(number)
                        ? 'bg-dream-blue text-white'
                        : 'bg-gray-100 dark:bg-dark-bg-primary text-gray-700 dark:text-dark-text-primary hover:bg-gray-200 dark:hover:bg-dark-bg-secondary'
                    }`}
                  >
                    {number}
                  </button>
                ))}
              </div>
            </div>

            {isPermBet(game.type) && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-dark-bg-primary rounded-lg border border-blue-200 dark:border-dark-bg-secondary">
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                  Betting Mode
                </label>
                <div className="flex gap-2">
                  {['total', 'perLine'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setBetMode(mode)}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                        betMode === mode
                          ? 'bg-yellow-500 text-white'
                          : 'bg-white dark:bg-dark-bg-secondary text-gray-700 dark:text-dark-text-primary border border-gray-300 dark:border-dark-bg-secondary'
                      }`}
                    >
                      {mode === 'total' ? 'Total Stake' : 'Per Line'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-3 p-3 rounded-lg bg-gray-50 dark:bg-dark-bg-primary border border-gray-200 dark:border-dark-bg-secondary text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-dark-text-secondary">Available</span>
                <span className="font-semibold text-gray-900 dark:text-dark-text-primary">
                  {balanceLoading ? '...' : `${formatUsdt(usdtBalance ?? 0)} USDT`}
                </span>
              </div>
              {betPreview?.totalCost > 0 && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-gray-600 dark:text-dark-text-secondary">Total stake</span>
                  <span className="font-semibold text-yellow-600 dark:text-yellow-500">
                    {formatUsdt(betPreview.totalCost)} USDT
                  </span>
                </div>
              )}
              {affordability.status === 'insufficient' && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-red-500">Shortfall</span>
                  <span className="font-semibold text-red-500">
                    {formatUsdt(affordability.shortfall)} USDT
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium dark:text-dark-text-secondary">
                {betMode === 'total' ? 'Total Stake (USDT)' : 'Stake Per Line (USDT)'}
              </label>
              {affordability.status === 'insufficient' && (
                <button
                  onClick={() => router.push('/wallet')}
                  className="ml-2 px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                >
                  Receive
                </button>
              )}
              {affordability.status === 'error' && (
                <button
                  onClick={() => refreshBalance()}
                  className="ml-2 px-3 py-1 text-xs bg-gray-200 dark:bg-dark-bg-secondary rounded"
                >
                  Retry
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="Enter amount"
                className={`w-full p-3 border rounded-lg dark:bg-dark-bg-primary dark:border-dark-bg-secondary ${
                  affordability.status === 'sufficient'
                    ? 'border-green-500'
                    : affordability.status === 'insufficient' || betValidationError
                      ? 'border-red-500'
                      : ''
                }`}
                min={Number(game.minBetAmount) || 1}
              />
              {(balanceLoading || isRefreshingForBet) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500" />
                </div>
              )}
            </div>
            {(betValidationError ||
              (affordability.message && affordability.status !== 'unknown')) && (
              <p
                className={`mt-2 text-sm ${
                  affordability.status === 'sufficient' ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {betValidationError || affordability.message}
              </p>
            )}
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 5].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount.toString())}
                  className="flex-1 bg-gray-100 dark:bg-dark-bg-primary text-gray-700 dark:text-dark-text-primary py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-bg-secondary transition-colors"
                >
                  {amount} USDT
                </button>
              ))}
            </div>

            {betPreview && (
              <div className="mt-6 mb-2 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-dark-bg-secondary dark:to-dark-bg-primary rounded-lg border border-purple-200 dark:border-dark-bg-secondary">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-3">
                  Bet Summary
                </h3>

                {betPreview.isPermBet && betPreview.numberOfCombinations > 1 ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <Stat label="Combinations" value={betPreview.numberOfCombinations} />
                      <Stat label="Per Line" value={`${betPreview.stakePerLine.toFixed(2)} USDT`} />
                      <Stat label="Total Cost" value={`${betPreview.totalCost.toFixed(2)} USDT`} accent />
                      <Stat
                        label="Win Per Line"
                        value={`${betPreview.winningsPerLine.toFixed(2)} USDT`}
                        positive
                      />
                    </div>
                    <div className="bg-white dark:bg-dark-bg-secondary p-3 rounded-lg mb-3">
                      <p className="text-xs text-gray-600 dark:text-dark-text-secondary mb-1">
                        Potential Total Winnings
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-500">
                        {betPreview.totalPotentialWinnings.toLocaleString()} USDT
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCombinations(!showCombinations)}
                      className="w-full flex items-center justify-between py-2 px-3 bg-white dark:bg-dark-bg-secondary rounded-lg"
                    >
                      <span className="text-sm font-medium text-gray-700 dark:text-dark-text-primary">
                        {showCombinations ? 'Hide' : 'View'} All Combinations
                      </span>
                      {showCombinations ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                    {showCombinations && (
                      <div className="mt-3 max-h-60 overflow-y-auto bg-white dark:bg-dark-bg-secondary rounded-lg p-3">
                        {(() => {
                          try {
                            const { combinations } = BetCalculator.calculateBet({
                              selectedNumbers,
                              betType: game.type,
                              amount: Number(betAmount),
                              mode: betMode,
                              gameOdds: game.odds,
                            });
                            return (
                              <div className="space-y-1">
                                {combinations.map((combo, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-2 py-1 px-2 bg-gray-50 dark:bg-dark-bg-primary rounded text-sm"
                                  >
                                    <span className="text-gray-500 w-6">{index + 1}.</span>
                                    <div className="flex gap-1 flex-wrap">
                                      {combo.map((num, i) => (
                                        <span
                                          key={i}
                                          className="w-7 h-7 rounded-full bg-dream-blue text-white flex items-center justify-center text-xs font-medium"
                                        >
                                          {num}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          } catch {
                            return <p className="text-red-500 text-sm">Error generating combinations</p>;
                          }
                        })()}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white dark:bg-dark-bg-secondary p-4 rounded-lg text-center">
                    <p className="text-xs text-gray-600 dark:text-dark-text-secondary mb-2">Your Stake</p>
                    <p className="text-xl font-bold text-yellow-600 dark:text-yellow-500 mb-4">
                      {Number(betAmount).toLocaleString()} USDT
                    </p>
                    <p className="text-xs text-gray-600 dark:text-dark-text-secondary mb-2">
                      Potential Winnings
                    </p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-500">
                      {betPreview.potentialWinnings.toLocaleString()} USDT
                    </p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handlePlayNow}
              disabled={!isBetValid()}
              className={`w-full mt-4 py-3 rounded-lg font-medium transition-colors ${
                isBetValid()
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                  : 'bg-gray-300 dark:bg-dark-bg-primary text-gray-500 dark:text-dark-text-secondary cursor-not-allowed'
              }`}
            >
              {getValidationMessage() || 'Play Now'}
            </button>
          </div>
        </div>
      </main>

      <Navigation activePage="games" />

      {showConfirmation && (
        <BetConfirmationModal
          isOpen={showConfirmation}
          game={game}
          selectedNumbers={selectedNumbers}
          betAmount={Number(betAmount)}
          betMode={betMode}
          betPreview={betPreview}
          onClose={() => setShowConfirmation(false)}
          onConfirm={async () => {
            setShowConfirmation(false);
            await refreshBalance();
          }}
        />
      )}
    </div>
  );
};

function Meta({ label, value }) {
  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-dark-text-secondary">{label}</p>
      <p className="font-medium dark:text-dark-text-primary">{value}</p>
    </div>
  );
}

function Stat({ label, value, accent, positive }) {
  return (
    <div className="bg-white dark:bg-dark-bg-secondary p-3 rounded-lg">
      <p className="text-xs text-gray-600 dark:text-dark-text-secondary">{label}</p>
      <p
        className={`text-lg font-bold ${
          accent
            ? 'text-yellow-600 dark:text-yellow-500'
            : positive
              ? 'text-green-600 dark:text-green-500'
              : 'text-gray-900 dark:text-dark-text-primary'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default GameDetail;
