import Head from "next/head";
import { useState, useEffect } from "react";
import { ethers, BigNumber } from "ethers";

const STAKE_CONTRACT_ADDRESS = "0xA2D6fa067527ec666eec745dE8aA07C529b27e99";
const TREASURY_CONTRACT_ADDRESS = "0xc5d492ac06EE58226A437C8473B7dCB34F707507";
const STAKE_CONTRACT_ABI = require("../contracts/Stake.json");
const TREASURY_CONTRACT_ABI = require("../contracts/Treasury.json");

export default function Home() {
  const [walletAddress, setWalletAddress] = useState(null);

  // Loading State
  const [isLoading, setIsLoading] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);

  // Error Message
  const [errorDeposit, setErrorDeposit] = useState(null);
  const [errorWithdraw, setErrorWithdraw] = useState(null);
  const [errorStake, setErrorStake] = useState(null);
  const [errorUnstake, setErrorUnstake] = useState(null);

  // Your Balance
  const [appBalance, setAppBalance] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [currentGas, setCurrentGas] = useState(0);

  const [walletBalanceBigNumber, setWalletBalanceBigNumber] = useState(null);
  const [availableBalanceForDeposit, setAvailableBalanceForDeposit] = useState(null);

  // Stake
  const [stakedBalance, setStakedBalance] = useState(0);
  const [stakeAmount, setStakeAmount] = useState(0);
  const [stakeTime, setStakeTime] = useState(null);
  const [stakeInterestRate, setStakeInterestRate] = useState(1);

  // Treasury
  const [treasuryBalance, setTreasuryBalance] = useState(0);
  const [treasuryStakers, setTreasuryStakers] = useState(0);
  const [treasuryMinStakeSeconds, setTreasuryMinStakeSeconds] = useState(0);
  const [treasuryMaxStakeSeconds, setTreasuryMaxStakeSeconds] = useState(0);
  const [treasuryWithdrawalEndSeconds, setTreasuryWithdrawalEndSeconds] = useState(0);

  useEffect(() => {
    checkIfWalletIsConnected();
    walletChangeListener();
    // fetchRecipient();
    // fetchContractBalance();
    // fetchMessages();
  }, []);

  useEffect(() => {
    if (walletAddress) {
      fetchWalletBalance();
      fetchAppBalance();
      fetchStakedBalance();
      fetchTreasuryInfo();
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletBalance > 0) {
      fetchDepositGas();
    }
  }, [walletBalance]);

  const checkIfWalletIsConnected = async () => {
    try {
      if (window.ethereum) {
        const { ethereum } = window;

        const accounts = await ethereum.request({
          method: "eth_accounts",
        });

        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          ensureOnNetwork();
        }
      }
    } catch (err) {
      console.error("Please install metamask");
    }
  };

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const { ethereum } = window;

        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });

        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          ensureOnNetwork();
        } else {
          alert("No address found");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const walletChangeListener = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        ethereum.on("accountsChanged", async (accounts) => {
          if (accounts.length === 0) {
            // Disconnected
            setWalletAddress(null);
          } else {
            setWalletAddress(accounts[0]);
            ensureOnNetwork();
          }
        });
      }
    } catch (err) {}
  };

  const ensureOnNetwork = async () => {
    try {
      const { ethereum } = window;

      const provider = new ethers.providers.Web3Provider(ethereum);
      const { chainId } = await provider.getNetwork();
      console.log(`chainId: ${chainId}`);

      if (chainId !== 5) {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [
            {
              chainId: `0x${Number(5).toString(16)}`,
            },
          ],
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const balance = await provider.getBalance(walletAddress);

        setWalletBalanceBigNumber(balance);

        let remainder = balance.mod(1e14);
        let balanceInEth = ethers.utils.formatEther(balance.sub(remainder));

        setWalletBalance(+balanceInEth);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAppBalance = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const stake = new ethers.Contract(STAKE_CONTRACT_ADDRESS, STAKE_CONTRACT_ABI.abi, provider);

        const balance = await stake.getBalance(walletAddress);
        let remainder = balance.mod(1e14);
        let balanceInEth = ethers.utils.formatEther(balance.sub(remainder));

        setAppBalance(+balanceInEth);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStakedBalance = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const stake = new ethers.Contract(STAKE_CONTRACT_ADDRESS, STAKE_CONTRACT_ABI.abi, provider);

        const balance = await stake.getStake(walletAddress);
        let remainder = balance.mod(1e14);
        let balanceInEth = ethers.utils.formatEther(balance.sub(remainder));

        setStakedBalance(+balanceInEth);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepositGas = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);

        const gasPrice = await provider.getGasPrice();
        const depositGas = gasPrice.mul(21000 * 3);

        const availableBalance = walletBalanceBigNumber.sub(depositGas);

        let remainder = availableBalance.mod(1e14);
        let availableBalanceInEth = ethers.utils.formatEther(availableBalance.sub(remainder));

        setAvailableBalanceForDeposit(+availableBalanceInEth);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deposit = async () => {
    if (!depositAmount) {
      setErrorDeposit("Please enter an amount");
      return;
    }

    setIsDepositing(true);
    setErrorDeposit(null);

    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const stake = new ethers.Contract(STAKE_CONTRACT_ADDRESS, STAKE_CONTRACT_ABI.abi, signer);

        const tx = await signer.sendTransaction({
          from: walletAddress,
          to: STAKE_CONTRACT_ADDRESS,
          value: ethers.utils.parseEther(depositAmount),
        });

        await tx.wait();

        await fetchWalletBalance();
        await fetchAppBalance();

        setDepositAmount(0);
      }
    } catch (err) {
      console.error(err);
      setErrorDeposit(err.message);
    } finally {
      setIsDepositing(false);
    }
  };

  const withdraw = async () => {
    setIsWithdrawing(true);

    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const stake = new ethers.Contract(STAKE_CONTRACT_ADDRESS, STAKE_CONTRACT_ABI.abi, signer);

        const tx = await stake.withdraw();

        await tx.wait();

        await fetchWalletBalance();
        await fetchAppBalance();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const stake = async () => {
    if (!stakeAmount) {
      setErrorStake("Please enter an amount");
      return;
    }

    if (stakeAmount > appBalance) {
      setErrorStake("Cannot stake more than you have");
      return;
    }

    setIsStaking(true);
    setErrorStake(null);

    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const stake = new ethers.Contract(STAKE_CONTRACT_ADDRESS, STAKE_CONTRACT_ABI.abi, signer);

        const tx = await stake.stake(ethers.utils.parseEther(stakeAmount));

        await tx.wait();

        await fetchAppBalance();
        await fetchStakedBalance();
        await fetchTreasuryInfo();

        setStakeAmount(0);
      }
    } catch (err) {
      console.error(err);
      setErrorStake(err.message);
    } finally {
      setIsStaking(false);
    }
  };

  const fetchTreasuryInfo = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const stake = new ethers.Contract(STAKE_CONTRACT_ADDRESS, STAKE_CONTRACT_ABI.abi, provider);
        const treasury = new ethers.Contract(TREASURY_CONTRACT_ADDRESS, TREASURY_CONTRACT_ABI.abi, provider);

        const [
          _treasuryBalance,
          _stakers,
          _stakeTime,
          _minStakeSeconds,
          _maxStakeSeconds,
          _withdrawalPeriodEndsSeconds,
        ] = await Promise.all([
          await provider.getBalance(TREASURY_CONTRACT_ADDRESS),
          await treasury.stakers(),
          await stake.getStakeTime(walletAddress),
          await stake.minStakeSeconds(),
          await stake.maxStakeSeconds(),
          await stake.withdrawalPeriodEndsSeconds(),
        ]);

        setTreasuryBalance(ethers.utils.formatEther(_treasuryBalance));
        setTreasuryStakers(_stakers.toNumber());
        setStakeTime(_stakeTime.toNumber() ? _stakeTime.toNumber() * 1000 : null);
        setTreasuryMinStakeSeconds(_minStakeSeconds.toNumber());
        setTreasuryMaxStakeSeconds(_maxStakeSeconds.toNumber());
        setTreasuryWithdrawalEndSeconds(_withdrawalPeriodEndsSeconds.toNumber());

        console.log(_minStakeSeconds.toNumber());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const canUnstake = () => {
    if (stakeTime) {
      const now = new Date();
      const exceededMinStake = stakeTime + treasuryMinStakeSeconds * 1000 - now < 0;
      const exceededWithdrawal = stakeTime + treasuryWithdrawalEndSeconds * 1000 - now < 0;

      return exceededMinStake && !exceededWithdrawal;
    }

    return false;
  };

  const unstake = async () => {
    setIsUnstaking(true);
    setErrorUnstake(null);

    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const stake = new ethers.Contract(STAKE_CONTRACT_ADDRESS, STAKE_CONTRACT_ABI.abi, signer);

        const tx = await stake.unstake();
        await tx.wait();

        await fetchAppBalance();
        await fetchStakedBalance();
        await fetchTreasuryInfo();
      }
    } catch (err) {
      console.error(err);
      setErrorUnstake(err.message);
    } finally {
      setIsUnstaking(false);
    }
  };

  const buyCoffee = async () => {
    if (name === "") {
      alert("Please enter your name");
      return;
    }

    if (message === "") {
      alert("Please enter your message");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { ethereum } = window;

      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI.abi, signer);

      const amount = coffeeSize === "S" ? ethers.utils.parseEther("0.001") : ethers.utils.parseEther("0.003");

      const tx = await contract.buyCoffee(name, message, {
        value: amount,
      });

      const receipt = await tx.wait();
      console.log(receipt);

      await fetchMessages();
      await fetchContractBalance();
      setName("");
      setMessage("");
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const setMyselfAsRecipient = async () => {
    setErrorMessageSettingNewRecipient(null);

    try {
      const { ethereum } = window;

      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI.abi, signer);

      const tx = await contract.setMyselfAsRecipient();
      const receipt = await tx.wait();

      console.log(receipt);

      await fetchRecipient();
    } catch (err) {
      console.error(err);
      setErrorMessageSettingNewRecipient(err.message);
    } finally {
    }
  };

  const changeCoffeeSize = (size) => {
    setCoffeeSize(size);
  };

  const fetchRecipient = async () => {
    try {
      const { ethereum } = window;

      const provider = new ethers.providers.Web3Provider(ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI.abi, provider);

      const recipient = await contract.recipient();

      setRecipient(recipient);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchContractBalance = async () => {
    try {
      const { ethereum } = window;

      const provider = new ethers.providers.Web3Provider(ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI.abi, provider);

      const balance = await provider.getBalance(contract.address);

      setContractBalance(ethers.utils.formatEther(balance));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async () => {
    try {
      const { ethereum } = window;

      const provider = new ethers.providers.Web3Provider(ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI.abi, provider);

      const memos = await contract.memos();

      setMemos(memos);
    } catch (err) {
      console.error(err);
    }
  };

  const setMaxDepositAmount = () => {
    if (availableBalanceForDeposit) {
      setDepositAmount(availableBalanceForDeposit.toString());
    }
  };

  const setMaxStakeAmount = () => {
    if (appBalance) {
      setStakeAmount(appBalance.toString());
    }
  };

  const loadingIcon = (color = "text-white") => (
    <svg
      className={`animate-spin mt-1 h-6 w-6 ${color} inline-block`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  const roadToWeb3Intro = () => (
    <>
      <h1 className="text-5xl text-white mt-6">
        Road to Web3
        <br />
        <strong>Week 6</strong>
      </h1>
      <p className="mt-6 text-lg max-w-xl text-gray-400">
        This is a practice project to learn ethers.js and solidity. The sixth week is to build a &quot;Staking
        App&quot;.
        <br />
        <a
          href="https://docs.alchemy.com/alchemy/road-to-web3/weekly-learning-challenges/6.-how-to-build-a-staking-dapp"
          target="_blank"
          rel="noreferrer"
          className="inline-block bg-slate-600 rounded-md text-white mt-6 p-1 px-2 hover:bg-slate-700"
        >
          ➡️ Amazing tutorial here
        </a>
        <br />
        <a
          target="_blank"
          rel="noreferrer"
          href="https://twitter.com/stevenkin"
          className="mt-6 bg-slate-800 text-slate-300 rounded-full text-sm inline-block py-2 px-4 hover:bg-slate-700"
        >
          Follow me @stevenkin
        </a>
      </p>
    </>
  );

  return (
    <div className="bg-slate-900 min-h-screen">
      <Head>
        <title>Road to Web3 - Week 6</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="mx-auto px-6 py-6 lg:p-12">
        {!walletAddress && <div className="mb-12 max-w-xl mx-auto">{roadToWeb3Intro()}</div>}
        {walletAddress && <div className="lg:hidden mb-12">{roadToWeb3Intro()}</div>}

        {walletAddress && (
          <div className="flex flex-wrap lg:flex-nowrap">
            <div className="self-start w-full lg:w-1/3 mb-8 lg:mb-0 lg:m-3">
              <div className="self-start w-full bg-white rounded-xl overflow-hidden">
                <h4 className="text-2xl text-center bg-indigo-700 p-2 text-white">Your Balance in this App</h4>
                <div className="p-4">
                  <h5 className="text-center p-2 text-xl italic text-gray-400">Balance</h5>
                  <div className="text-center text-3xl text-gray-700">
                    <span className="block mb-1 text-indigo-700">{appBalance} ETH</span>
                    <button
                      className="bg-slate-300 hover:bg-slate-400 hover:text-slate-100 inline-block text-lg rounded-full text-slate-500 px-3 py-px disabled:bg-slate-100 disabled:text-slate-300"
                      disabled={appBalance === 0 || isWithdrawing}
                      onClick={withdraw}
                    >
                      {isWithdrawing ? loadingIcon("text-slate-500") : "Withdraw"}
                    </button>
                  </div>
                  <div className="relative mt-8">
                    <p className="text-right text-slate-400 -mb-1">Available Balance: {walletBalance} ETH</p>
                    <div className="relative">
                      <input
                        type="text"
                        onInput={(e) => setDepositAmount(e.target.value)}
                        value={depositAmount}
                        className="w-full bg-white border outline-none border-indigo-300 focus:border-indigo-500 py-3 px-4 rounded-lg mt-2 rounded-bl-none rounded-br-none"
                        placeholder="Enter Amount"
                        disabled={isStaking}
                      />
                      <span
                        className="absolute text-xl inline-block bg-gray-100 rounded px-5 py-2 text-gray-600"
                        style={{ top: "11px", right: "3px" }}
                      >
                        ETH
                      </span>

                      <span
                        className="absolute text-md hover:bg-slate-400 cursor-pointer inline-block bg-slate-300 rounded px-2 text-gray-600"
                        style={{ top: "21px", right: "96px" }}
                        onClick={setMaxDepositAmount}
                      >
                        MAX
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={deposit}
                    disabled={isDepositing}
                    className="py-1 px-2 mb-2 pb-3 w-full disabled:bg-indigo-300 bg-indigo-600 hover:bg-indigo-700 shadow rounded-lg text-white text-xl rounded-tl-none rounded-tr-none"
                  >
                    {isDepositing ? (
                      loadingIcon()
                    ) : (
                      <>
                        Deposit <span className="text-3xl relative top-1 left-1">💵</span>
                      </>
                    )}
                  </button>
                  {errorDeposit && <p className="px-2 py-2 text-red-600">{errorDeposit}</p>}
                </div>
              </div>

              <div className="mt-8 hidden lg:block">{roadToWeb3Intro()}</div>
            </div>
            <div className="self-start w-full lg:w-1/3 mb-8 lg:mb-0 lg:m-3">
              <div className="self-start w-full bg-white rounded-xl overflow-hidden">
                <h4 className="text-2xl text-center bg-indigo-700 bg- p-2 text-white">Stake Contract</h4>
                <div className="p-4">
                  <div className="flex w-full">
                    <div className="flex-1">
                      <h5 className="text-center p-2 text-xl italic text-gray-400">Status</h5>
                      <div className="text-center text-3xl text-indigo-700">
                        {stakedBalance > 0 ? `Staked ${stakedBalance} ETH` : "Not Staked"}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h5 className="text-center p-2 text-xl italic text-gray-400">Interest Rate</h5>
                      <div className="text-center text-3xl text-indigo-700">{stakeInterestRate}%</div>
                    </div>
                  </div>
                  <div className="relative mt-6 mb-4">
                    <img src="/images/interest-rate.png" className="w-full rounded-lg" />
                  </div>
                  <div>
                    <div className="relative">
                      <input
                        type="text"
                        onInput={(e) => setStakeAmount(e.target.value)}
                        value={stakeAmount}
                        className="w-full bg-white border outline-none border-indigo-300 focus:border-indigo-500 py-3 px-4 rounded-lg mt-2 rounded-bl-none rounded-br-none"
                        placeholder="Enter Amount"
                        disabled={isStaking}
                      />
                      <span
                        className="absolute text-xl inline-block bg-gray-100 rounded px-5 py-2 text-gray-600"
                        style={{ top: "11px", right: "3px" }}
                      >
                        ETH
                      </span>
                      <span
                        className="absolute text-md hover:bg-slate-400 cursor-pointer inline-block bg-slate-300 rounded px-2 text-gray-600"
                        style={{ top: "21px", right: "96px" }}
                        onClick={setMaxStakeAmount}
                      >
                        MAX
                      </span>
                    </div>
                    <button
                      onClick={stake}
                      disabled={isStaking || stakedBalance > 0 || appBalance === 0}
                      className="py-2 px-2 mb-2 pb-3 w-full disabled:bg-indigo-300 bg-indigo-600 hover:bg-indigo-700 shadow rounded-lg text-white text-xl rounded-tl-none rounded-tr-none"
                    >
                      {isStaking ? (
                        loadingIcon()
                      ) : (
                        <>
                          Stake <span className="text-3xl relative left-1">🏦</span>
                        </>
                      )}
                    </button>
                  </div>
                  {errorStake && <p className="px-4 py-2 text-red-600">{errorStake}</p>}
                </div>
              </div>
            </div>

            <div className="self-start w-full mt-6 md:mt-3 lg:w-1/3 mb-8 lg:mb-0 lg:m-3 bg-white rounded-xl overflow-hidden">
              <h4 className="text-2xl text-center bg-indigo-700 p-2 text-white">Treasury Contract</h4>
              <div className="p-4 pb-4">
                <div className="flex w-full">
                  <div className="flex-1">
                    <h5 className="text-center p-2 text-xl italic text-gray-400">Contract Balance</h5>
                    <div className="text-center text-3xl text-indigo-700">{treasuryBalance} ETH</div>
                  </div>
                  <div className="flex-1">
                    <h5 className="text-center p-2 text-xl italic text-gray-400">Stakers</h5>
                    <div className="text-center text-3xl text-indigo-700">{treasuryStakers}</div>
                  </div>
                </div>

                <p className="px-4 py-2 bg-gray-200 text-gray-500 rounded-md mt-10 text-center">
                  Staked assets will be saved into this contract to demo putting in and getting out assets from the
                  stake contract.
                </p>

                <div className="flex w-full mt-8">
                  <div className="flex-1">
                    <h5 className="text-center p-2 text-xl italic text-gray-400">Your Stake Time</h5>
                    <div className="text-center text-3xl text-indigo-700">
                      {stakeTime
                        ? new Date(stakeTime).toLocaleDateString() + " " + new Date(stakeTime).toLocaleTimeString()
                        : "Not Staked"}
                    </div>
                  </div>
                </div>

                <div className="flex w-full mt-8">
                  <div className="flex-1">
                    <h5 className="text-center p-2 text-xl italic text-gray-400">Min. Stake Time</h5>
                    <div className="text-center text-3xl text-indigo-700">
                      {stakeTime
                        ? `${new Date(stakeTime + treasuryMinStakeSeconds * 1000).toLocaleTimeString()}`
                        : `${(treasuryMinStakeSeconds / 60).toFixed(0)} minutes`}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h5 className="text-center p-2 text-xl italic text-gray-400">Max. Stake Time</h5>
                    <div className="text-center text-3xl text-indigo-700">
                      {stakeTime
                        ? `${new Date(stakeTime + treasuryMaxStakeSeconds * 1000).toLocaleTimeString()}`
                        : `${(treasuryMaxStakeSeconds / 60).toFixed(0)} minutes`}
                    </div>
                  </div>
                </div>

                <div className="flex w-full mt-8">
                  <div className="flex-1">
                    <h5 className="text-center p-2 text-xl italic text-gray-400">Withdrawal Period</h5>
                    <div className="text-center text-3xl text-indigo-700">
                      {stakeTime &&
                        `From ${new Date(
                          stakeTime + treasuryMinStakeSeconds * 1000
                        ).toLocaleTimeString()} to ${new Date(
                          stakeTime + treasuryWithdrawalEndSeconds * 1000
                        ).toLocaleTimeString()}`}

                      {!stakeTime && (
                        <>
                          Within {(treasuryMinStakeSeconds / 60).toFixed(0)} -{" "}
                          {(treasuryWithdrawalEndSeconds / 60).toFixed(0)} minutes after stake.
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={unstake}
                  disabled={isUnstaking || stakedBalance === 0 || !canUnstake()}
                  className="py-1 px-2 mb-2 mt-12 pb-3 w-full disabled:bg-indigo-300 bg-indigo-600 hover:bg-indigo-700 shadow rounded-lg text-white text-xl"
                >
                  {isUnstaking ? (
                    loadingIcon()
                  ) : (
                    <>
                      Unstake <span className="text-3xl relative top-1 left-1">💸</span>
                    </>
                  )}
                </button>
                {errorUnstake && <p className="px-4 py-2 text-red-600">{errorUnstake}</p>}
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-12">
          {!walletAddress && (
            <button
              className="mt-12 py-3 px-8 bg-indigo-700 shadow hover:bg-indigo-800 rounded-full text-white text-2xl"
              onClick={connectWallet}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
