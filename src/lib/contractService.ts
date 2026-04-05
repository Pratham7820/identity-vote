// Contract service using ethers.js to interact with the deployed EVoting smart contract
import { ethers } from 'ethers';
import EVotingABI from '@/contracts/EVotingABI.json';

// Store the contract address — set after deployment
const CONTRACT_ADDRESS_KEY = 'evoting_contract_address';

export function getContractAddress(): string | null {
  return localStorage.getItem(CONTRACT_ADDRESS_KEY);
}

export function setContractAddress(address: string) {
  localStorage.setItem(CONTRACT_ADDRESS_KEY, address);
}

export function clearContractAddress() {
  localStorage.removeItem(CONTRACT_ADDRESS_KEY);
}

// Get provider (read-only)
function getProvider(): ethers.BrowserProvider {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }
  return new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
}

// Get contract instance (read-only)
function getReadContract(): ethers.Contract {
  const address = getContractAddress();
  if (!address) throw new Error('Contract not connected');
  const provider = getProvider();
  return new ethers.Contract(address, EVotingABI, provider);
}

// Get contract instance (with signer for write operations)
async function getWriteContract(): Promise<ethers.Contract> {
  const address = getContractAddress();
  if (!address) throw new Error('Contract not connected');
  const provider = getProvider();
  const signer = await provider.getSigner();
  return new ethers.Contract(address, EVotingABI, signer);
}

// --- Types ---
export interface Candidate {
  id: number;
  name: string;
  party: string;
  voteCount: number;
}

export interface Voter {
  name: string;
  age: number;
  walletAddress: string;
  faceDescriptor: number[] | null;
  isRegistered: boolean;
  hasVoted: boolean;
}

export interface ElectionConfig {
  title: string;
  startTime: number; // unix timestamp
  endTime: number;   // unix timestamp
  isActive: boolean;
}

// --- Helper: Convert float32 array to/from bytes ---
export function floatsToBytes(floats: number[]): Uint8Array {
  const buffer = new ArrayBuffer(floats.length * 4);
  const view = new DataView(buffer);
  floats.forEach((f, i) => view.setFloat32(i * 4, f, true)); // little-endian
  return new Uint8Array(buffer);
}

export function bytesToFloats(bytes: Uint8Array): number[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const floats: number[] = [];
  for (let i = 0; i < bytes.length; i += 4) {
    floats.push(view.getFloat32(i, true));
  }
  return floats;
}

// --- Owner ---
export async function getOwner(): Promise<string> {
  const contract = getReadContract();
  return await contract.owner();
}

export async function isOwner(address: string): Promise<boolean> {
  try {
    const owner = await getOwner();
    return owner.toLowerCase() === address.toLowerCase();
  } catch {
    return false;
  }
}

// --- Election ---
export async function setElection(config: ElectionConfig): Promise<void> {
  const contract = await getWriteContract();
  const tx = await contract.setElection(
    config.title,
    BigInt(config.startTime),
    BigInt(config.endTime),
    config.isActive
  );
  await tx.wait();
}

export async function getElection(): Promise<ElectionConfig> {
  const contract = getReadContract();
  const [title, startTime, endTime, isActive] = await contract.getElection();
  return {
    title,
    startTime: Number(startTime),
    endTime: Number(endTime),
    isActive,
  };
}

export async function isElectionActive(): Promise<boolean> {
  const contract = getReadContract();
  return await contract.isElectionActive();
}

// --- Candidates ---
export async function addCandidate(name: string, party: string): Promise<void> {
  const contract = await getWriteContract();
  const tx = await contract.addCandidate(name, party);
  await tx.wait();
}

export async function removeCandidate(id: number): Promise<void> {
  const contract = await getWriteContract();
  const tx = await contract.removeCandidate(BigInt(id));
  await tx.wait();
}

export async function getCandidates(): Promise<Candidate[]> {
  const contract = getReadContract();
  const ids: bigint[] = await contract.getCandidateIds();
  const candidates: Candidate[] = [];
  for (const id of ids) {
    const [cId, name, party, voteCount, exists] = await contract.getCandidate(id);
    if (exists) {
      candidates.push({
        id: Number(cId),
        name,
        party,
        voteCount: Number(voteCount),
      });
    }
  }
  return candidates;
}

export async function getResults(): Promise<Candidate[]> {
  const candidates = await getCandidates();
  return candidates.sort((a, b) => b.voteCount - a.voteCount);
}

// --- Voters ---
export async function registerVoter(
  walletAddress: string,
  name: string,
  age: number,
  faceDescriptor: number[]
): Promise<void> {
  const contract = await getWriteContract();
  const faceBytes = floatsToBytes(faceDescriptor);
  const tx = await contract.registerVoter(
    walletAddress,
    name,
    BigInt(age),
    faceBytes
  );
  await tx.wait();
}

export async function getVoter(address: string): Promise<Voter | null> {
  try {
    const contract = getReadContract();
    const [name, age, walletAddress, faceDescriptor, isRegistered, hasVoted] =
      await contract.getVoter(address);
    if (!isRegistered) return null;
    
    const faceBytes = ethers.getBytes(faceDescriptor);
    const floats = faceBytes.length > 0 ? bytesToFloats(faceBytes) : null;
    
    return {
      name,
      age: Number(age),
      walletAddress,
      faceDescriptor: floats,
      isRegistered,
      hasVoted,
    };
  } catch {
    return null;
  }
}

export async function getAllVoters(): Promise<Voter[]> {
  const contract = getReadContract();
  const addresses: string[] = await contract.getVoterAddresses();
  const voters: Voter[] = [];
  for (const addr of addresses) {
    const voter = await getVoter(addr);
    if (voter) voters.push(voter);
  }
  return voters;
}

// --- Voting ---
export async function castVote(candidateId: number): Promise<void> {
  const contract = await getWriteContract();
  const tx = await contract.castVote(BigInt(candidateId));
  await tx.wait();
}
