import Head from "next/head";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

// const CONTRACT_ABI = require("../contracts/BuyMeACoffee.json");
const CONTRACT_ADDRESS = "0x04d91921a713ca3b82075a46807e99e168815e21";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isSettingNewRecipient, setIsSettingNewRecipient] = useState(false);

  const [errorMessage, setErrorMessage] = useState(null);
  const [errorMessageWithdraw, setErrorMessageWithdraw] = useState(null);
  const [errorMessageSettingNewRecipient, setErrorMessageSettingNewRecipient] = useState(null);

  const [coffeeSize, setCoffeeSize] = useState("S");
  const [recipient, setRecipient] = useState("");
  const [contractBalance, setContractBalance] = useState(0);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [memos, setMemos] = useState([]);

  useEffect(() => {
    checkIfWalletIsConnected();
    walletChangeListener();
    fetchRecipient();
    fetchContractBalance();
    fetchMessages();
  }, []);

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

  const withdraw = async () => {
    setIsWithdrawing(true);
    setErrorMessageWithdraw(null);

    try {
      const { ethereum } = window;

      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI.abi, signer);

      const tx = await contract.withdraw();

      const receipt = await tx.wait();
      console.log(receipt);

      await fetchContractBalance();
    } catch (err) {
      console.error(err);
      setErrorMessageWithdraw(err.message);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const setMyselfAsRecipient = async () => {
    setIsSettingNewRecipient(true);
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
      setIsSettingNewRecipient(false);
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

  const loadingIcon = () => (
    <svg
      className="animate-spin -mt-1 h-6 w-6 text-white inline-block"
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

  return (
    <div className="bg-slate-900 min-h-screen">
      <Head>
        <title>Road to Web3 - Week 6</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="mx-auto px-6 py-6 lg:p-12">
        <div className="lg:hidden mb-12">
          <h1 className="text-5xl text-white mt-6">
            Road to Web3
            <br />
            <strong>Week 6</strong>
          </h1>
          <p className="mt-6 text-lg max-w-xl text-gray-400">
            This is a practice project to learn Web3.js and solidity. The sixth week is to develop a &quot;Staking
            App&quot;.
            <br />
            <a
              href="https://docs.alchemy.com/alchemy/road-to-web3/weekly-learning-challenges/2.-how-to-build-buy-me-a-coffee-defi-dapp"
              target="_blank"
              rel="noreferrer"
              className="inline-block bg-slate-600 rounded-md text-white mt-6 p-1 px-2 hover:bg-slate-700"
            >
              ➡️ Amazing tutorial here
            </a>
          </p>
        </div>

        {walletAddress && (
          <div className="flex flex-wrap lg:flex-nowrap">
            <div className="self-start w-full lg:w-1/3 mb-8 lg:mb-0 lg:m-3">
              <div className="self-start w-full bg-white rounded-xl overflow-hidden">
                <h4 className="text-2xl text-center bg-indigo-700 p-2 text-white">Your Balance in this App</h4>
                <div className="p-4">
                  <h5 className="text-center p-2 text-xl italic text-gray-400">Balance</h5>
                  <div className="text-center text-3xl text-gray-700">
                    <span className="block mb-1 text-indigo-700">0.01 ETH</span>
                    <button className="bg-slate-300 hover:bg-slate-400 hover:text-slate-100 inline-block text-lg rounded-full text-slate-500 px-3">
                      Withdraw
                    </button>
                  </div>
                  <div className="relative mt-8">
                    <input
                      type="text"
                      onInput={() => setMessage(event.target.value)}
                      value={message}
                      className="w-full bg-white border outline-none border-indigo-400 py-3 px-4 rounded-lg mt-2 rounded-bl-none rounded-br-none"
                      placeholder="Enter Amount"
                      disabled={isLoading}
                    />
                    <span
                      className="absolute text-xl inline-block bg-gray-100 rounded px-5 py-2 text-gray-600"
                      style={{ top: "11px", right: "3px" }}
                    >
                      ETH
                    </span>
                  </div>
                  <button
                    onClick={buyCoffee}
                    disabled={isLoading}
                    className="py-1 px-2 mb-2 pb-3 w-full bg-indigo-600 hover:bg-indigo-700 shadow rounded-lg text-white text-xl rounded-tl-none rounded-tr-none"
                  >
                    {isLoading ? (
                      loadingIcon()
                    ) : (
                      <>
                        Deposit <span className="text-3xl relative top-1 left-1">💵</span>
                      </>
                    )}
                  </button>
                  {errorMessage && <p className="px-4 py-2 text-red-600">{errorMessage}</p>}
                </div>
              </div>

              <div className="mt-8 hidden lg:block">
                <h1 className="text-4xl text-white">
                  Road to Web3
                  <br />
                  <strong>Week 6</strong>
                </h1>
                <p className="mt-4 text-md max-w-xl mx-auto text-gray-400">
                  This is a practice project to learn Web3.js and solidity. The sixth week is to develop a &quot;Staking
                  App&quot;.
                  <br />
                  <a
                    href="https://docs.alchemy.com/alchemy/road-to-web3/weekly-learning-challenges/2.-how-to-build-buy-me-a-coffee-defi-dapp"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block bg-gray-700 rounded-md text-gray-300 mt-6 p-1 px-2 hover:bg-gray-600"
                  >
                    ➡️ Amazing tutorial here
                  </a>
                </p>
              </div>
            </div>
            <div className="self-start w-full lg:w-1/3 mb-8 lg:mb-0 lg:m-3">
              <div className="self-start w-full bg-white rounded-xl overflow-hidden">
                <h4 className="text-2xl text-center bg-indigo-700 bg- p-2 text-white">Stake Contract</h4>
                <div className="p-4">
                  <div className="flex w-full">
                    <div className="flex-1">
                      <h5 className="text-center p-2 text-xl italic text-gray-400">Status</h5>
                      <div className="text-center text-3xl text-indigo-700">Not Staked</div>
                    </div>
                    <div className="flex-1">
                      <h5 className="text-center p-2 text-xl italic text-gray-400">Interest Rate</h5>
                      <div className="text-center text-3xl text-indigo-700">1%</div>
                    </div>
                  </div>
                  <div className="relative mt-6 mb-4">
                    <img src="/images/interest-rate.png" className="w-full rounded-lg" />
                  </div>
                  <div>
                    <div className="relative">
                      <input
                        type="text"
                        onInput={() => setMessage(event.target.value)}
                        value={message}
                        className="w-full bg-white border outline-none border-indigo-400 py-3 px-4 rounded-lg mt-2 rounded-bl-none rounded-br-none"
                        placeholder="Enter Amount"
                        disabled={isLoading}
                      />
                      <span
                        className="absolute text-xl inline-block bg-gray-100 rounded px-5 py-2 text-gray-600"
                        style={{ top: "11px", right: "3px" }}
                      >
                        ETH
                      </span>
                    </div>
                    <button
                      onClick={buyCoffee}
                      disabled={true}
                      className="py-2 px-2 mb-2 pb-3 w-full disabled:bg-indigo-300 bg-indigo-600 hover:bg-indigo-700 shadow rounded-lg text-white text-xl rounded-tl-none rounded-tr-none"
                    >
                      {isLoading ? (
                        loadingIcon()
                      ) : (
                        <>
                          Stake <span className="text-3xl relative left-1">🏦</span>
                        </>
                      )}
                    </button>
                  </div>
                  {errorMessage && <p className="px-4 py-2 text-red-600">{errorMessage}</p>}
                </div>
              </div>
            </div>

            <div className="self-start w-full mt-6 md:mt-3 lg:w-1/3 mb-8 lg:mb-0 lg:m-3 bg-white rounded-xl overflow-hidden">
              <h4 className="text-2xl text-center bg-indigo-700 p-2 text-white">Treasury Contract</h4>
              <div className="p-4 pb-4">
                <div className="flex w-full">
                  <div className="flex-1">
                    <h5 className="text-center p-2 text-xl italic text-gray-400">Contract Balance</h5>
                    <div className="text-center text-3xl text-indigo-700">10 ETH</div>
                  </div>
                  <div className="flex-1">
                    <h5 className="text-center p-2 text-xl italic text-gray-400">Stakers</h5>
                    <div className="text-center text-3xl text-indigo-700">4</div>
                  </div>
                </div>

                <p className="px-4 py-2 bg-gray-200 text-gray-500 rounded-md mt-10 text-center">
                  Staked assets will be saved into this contract to demo putting in and getting out assets from the
                  stake contract.
                </p>

                <div className="flex w-full mt-8">
                  <div className="flex-1">
                    <h5 className="text-center p-2 text-xl italic text-gray-400">Min. Stake Time</h5>
                    <div className="text-center text-3xl text-indigo-700">2 minutes</div>
                  </div>
                  <div className="flex-1">
                    <h5 className="text-center p-2 text-xl italic text-gray-400">Max. Stake Time</h5>
                    <div className="text-center text-3xl text-indigo-700">4 minutes</div>
                  </div>
                </div>

                <div className="flex w-full mt-8">
                  <div className="flex-1">
                    <h5 className="text-center p-2 text-xl italic text-gray-400">Withdrawal Period</h5>
                    <div className="text-center text-3xl text-indigo-700">Within 2 - 6 minutes after stake.</div>
                  </div>
                </div>

                <div className="flex w-full mt-8">
                  <div className="flex-1">
                    <h5 className="text-center p-2 text-xl italic text-gray-400">Your Stake Time</h5>
                    <div className="text-center text-3xl text-indigo-700">2022/08/04 12:30</div>
                  </div>
                </div>

                <button
                  onClick={buyCoffee}
                  disabled={true}
                  className="py-1 px-2 mb-2 mt-12 pb-3 w-full disabled:bg-indigo-300 bg-indigo-600 hover:bg-indigo-700 shadow rounded-lg text-white text-xl"
                >
                  {isLoading ? (
                    loadingIcon()
                  ) : (
                    <>
                      Unstake <span className="text-3xl relative top-1 left-1">💸</span>
                    </>
                  )}
                </button>
                {errorMessage && <p className="px-4 py-2 text-red-600">{errorMessage}</p>}
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
