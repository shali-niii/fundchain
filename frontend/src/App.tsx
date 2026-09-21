import { useState, useEffect } from "react";
import { ethers } from "ethers";
import toast, { Toaster } from "react-hot-toast";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./constants/contract";

interface Campaign {
  owner: string;
  title: string;
  description: string;
  target: string;
  deadline: number;
  amountRaised: string;
  image: string;
  claimed: boolean;
}

export default function App() {
  const [account, setAccount] = useState<string>("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [image, setImage] = useState("");

  const connectWallet = async () => {
    if ((window as any).ethereum) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
        toast.success("Wallet connected!");
      } catch (err) {
        toast.error("Failed to connect wallet");
      }
    } else {
      toast.error("Please install MetaMask!");
    }
  };

  const fetchCampaigns = async () => {
    if (!(window as any).ethereum) return;
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    try {
      const data = await contract.getCampaigns();
      const formatted = data.map((c: any) => ({
        owner: c.owner,
        title: c.title,
        description: c.description,
        target: ethers.formatEther(c.target),
        deadline: Number(c.deadline),
        amountRaised: ethers.formatEther(c.amountRaised),
        image: c.image,
        claimed: c.claimed,
      }));
      setCampaigns(formatted);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    }
  };

  const createCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return toast.error("Connect wallet first!");

    setIsCreating(true);
    const toastId = toast.loading("Launching campaign on-chain...");

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);
      const targetInWei = ethers.parseEther(target);

      const tx = await contract.createCampaign(title, description, targetInWei, deadlineTimestamp, image);
      await tx.wait();

      toast.success("Campaign Created Successfully!", { id: toastId });
      setTitle("");
      setDescription("");
      setTarget("");
      setDeadline("");
      setImage("");
      fetchCampaigns();
    } catch (err) {
      console.error(err);
      toast.error("Transaction failed", { id: toastId });
    } finally {
      setIsCreating(false);
    }
  };

  const donate = async (id: number, amount: string) => {
    if (!account) return toast.error("Connect wallet first!");
    setLoadingId(id);
    const toastId = toast.loading("Processing donation...");

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.donateToCampaign(id, { value: ethers.parseEther(amount) });
      await tx.wait();

      toast.success("Donation Successful!", { id: toastId });
      fetchCampaigns();
    } catch (err) {
      console.error(err);
      toast.error("Donation failed", { id: toastId });
    } finally {
      setLoadingId(null);
    }
  };

  const withdrawFunds = async (id: number) => {
    if (!account) return toast.error("Connect wallet first!");
    setLoadingId(id);
    const toastId = toast.loading("Withdrawing funds...");

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.withdrawFunds(id);
      await tx.wait();

      toast.success("Funds Withdrawn Successfully!", { id: toastId });
      fetchCampaigns();
    } catch (err) {
      console.error(err);
      toast.error("Withdrawal failed", { id: toastId });
    } finally {
      setLoadingId(null);
    }
  };

  const requestRefund = async (id: number) => {
    if (!account) return toast.error("Connect wallet first!");
    setLoadingId(id);
    const toastId = toast.loading("Requesting refund...");

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.requestRefund(id);
      await tx.wait();

      toast.success("Refund Processed Successfully!", { id: toastId });
      fetchCampaigns();
    } catch (err) {
      console.error(err);
      toast.error("Refund failed", { id: toastId });
    } finally {
      setLoadingId(null);
    }
  };

  useEffect(() => {
    fetchCampaigns();

    if ((window as any).ethereum) {
      (window as any).ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          toast("Account switched!");
        } else {
          setAccount("");
          toast("Wallet disconnected");
        }
      });

      (window as any).ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
  }, []);

  const now = Math.floor(Date.now() / 1000);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <Toaster position="top-right" />
      <h1>FundChain Fundraising</h1>
      {!account ? (
        <button onClick={connectWallet}>Connect MetaMask</button>
      ) : (
        <p>Connected Account: {account}</p>
      )}

      <h2>Create Campaign</h2>
      <form onSubmit={createCampaign} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "400px" }}>
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
        <input placeholder="Target (ETH)" value={target} onChange={(e) => setTarget(e.target.value)} required />
        <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
        <input placeholder="Image URL" value={image} onChange={(e) => setImage(e.target.value)} required />
        <button type="submit" disabled={isCreating}>
          {isCreating ? "Launching..." : "Launch Campaign"}
        </button>
      </form>

      <h2>Active Campaigns</h2>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
        {campaigns.map((c, i) => {
          const isOwner = account.toLowerCase() === c.owner.toLowerCase();
          const targetMet = Number(c.amountRaised) >= Number(c.target);
          const expired = now > c.deadline;
          const progressPercent = Math.min((Number(c.amountRaised) / Number(c.target)) * 100, 100);
          const isLoading = loadingId === i;

          return (
            <div key={i} style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: "8px", width: "280px" }}>
              <img
                src={c.image}
                alt={c.title}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/280x150?text=FundChain";
                }}
                style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "4px" }}
              />
              <h3>{c.title}</h3>
              <p>{c.description}</p>
              
              <div style={{ background: "#333", height: "10px", borderRadius: "5px", overflow: "hidden", margin: "8px 0" }}>
                <div style={{ width: `${progressPercent}%`, background: "#4caf50", height: "100%" }} />
              </div>

              <p><strong>Goal:</strong> {c.target} ETH</p>
              <p><strong>Raised:</strong> {c.amountRaised} ETH ({progressPercent.toFixed(1)}%)</p>
              <p><strong>Status:</strong> {c.claimed ? "Claimed" : expired ? (targetMet ? "Goal Passed" : "Expired") : "Active"}</p>

              {!expired && !targetMet && (
                <button onClick={() => donate(i, "0.1")} disabled={isLoading}>
                  {isLoading ? "Processing..." : "Donate 0.1 ETH"}
                </button>
              )}

              {isOwner && targetMet && !c.claimed && (
                <button onClick={() => withdrawFunds(i)} disabled={isLoading} style={{ backgroundColor: "#2196F3", color: "white", marginTop: "0.5rem" }}>
                  {isLoading ? "Processing..." : "Withdraw Funds"}
                </button>
              )}

              {expired && !targetMet && (
                <button onClick={() => requestRefund(i)} disabled={isLoading} style={{ backgroundColor: "#f44336", color: "white", marginTop: "0.5rem" }}>
                  {isLoading ? "Processing..." : "Request Refund"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}