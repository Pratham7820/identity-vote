// Mock blockchain service simulating an Ethereum smart contract
// In production, replace with ethers.js contract interactions

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
  startDate: string;
  endDate: string;
  title: string;
  isActive: boolean;
}

const STORAGE_KEY = "evote_blockchain";

interface BlockchainState {
  owner: string;
  election: ElectionConfig;
  candidates: Candidate[];
  voters: Record<string, Voter>;
}

function getState(): BlockchainState {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  return {
    owner: "",
    election: { startDate: "", endDate: "", title: "", isActive: false },
    candidates: [],
    voters: {},
  };
}

function saveState(state: BlockchainState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Contract deployment - sets the owner
export function deployContract(ownerAddress: string) {
  const state = getState();
  state.owner = ownerAddress.toLowerCase();
  saveState(state);
}

export function getOwner(): string {
  return getState().owner;
}

export function isOwner(address: string): boolean {
  const state = getState();
  return state.owner.toLowerCase() === address.toLowerCase();
}

// Admin functions
export function setElection(config: ElectionConfig) {
  const state = getState();
  state.election = config;
  saveState(state);
}

export function getElection(): ElectionConfig {
  return getState().election;
}

export function addCandidate(name: string, party: string): Candidate {
  const state = getState();
  const candidate: Candidate = {
    id: state.candidates.length + 1,
    name,
    party,
    voteCount: 0,
  };
  state.candidates.push(candidate);
  saveState(state);
  return candidate;
}

export function removeCandidate(id: number) {
  const state = getState();
  state.candidates = state.candidates.filter((c) => c.id !== id);
  saveState(state);
}

export function getCandidates(): Candidate[] {
  return getState().candidates;
}

export function registerVoter(voter: Voter) {
  const state = getState();
  state.voters[voter.walletAddress.toLowerCase()] = {
    ...voter,
    walletAddress: voter.walletAddress.toLowerCase(),
    isRegistered: true,
    hasVoted: false,
  };
  saveState(state);
}

export function getVoter(address: string): Voter | null {
  const state = getState();
  return state.voters[address.toLowerCase()] || null;
}

export function getAllVoters(): Voter[] {
  const state = getState();
  return Object.values(state.voters);
}

export function castVote(voterAddress: string, candidateId: number): boolean {
  const state = getState();
  const voter = state.voters[voterAddress.toLowerCase()];
  if (!voter || !voter.isRegistered || voter.hasVoted) return false;

  const candidate = state.candidates.find((c) => c.id === candidateId);
  if (!candidate) return false;

  // Check election dates
  const now = new Date();
  const start = new Date(state.election.startDate);
  const end = new Date(state.election.endDate);
  if (now < start || now > end || !state.election.isActive) return false;

  candidate.voteCount++;
  voter.hasVoted = true;
  saveState(state);
  return true;
}

export function isElectionActive(): boolean {
  const state = getState();
  if (!state.election.isActive) return false;
  const now = new Date();
  const start = new Date(state.election.startDate);
  const end = new Date(state.election.endDate);
  return now >= start && now <= end;
}

export function getResults(): Candidate[] {
  return getState().candidates.sort((a, b) => b.voteCount - a.voteCount);
}

export function resetBlockchain() {
  localStorage.removeItem(STORAGE_KEY);
}
