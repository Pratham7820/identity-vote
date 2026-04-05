// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EVoting {
    address public owner;

    struct ElectionConfig {
        string title;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
    }

    struct Candidate {
        uint256 id;
        string name;
        string party;
        uint256 voteCount;
        bool exists;
    }

    struct Voter {
        string name;
        uint256 age;
        address walletAddress;
        bytes faceDescriptor; // 128 float32s stored as raw bytes (512 bytes)
        bool isRegistered;
        bool hasVoted;
    }

    ElectionConfig public election;
    
    uint256 public candidateCount;
    mapping(uint256 => Candidate) public candidates;
    uint256[] public candidateIds;

    mapping(address => Voter) public voters;
    address[] public voterAddresses;

    event ElectionSet(string title, uint256 startTime, uint256 endTime, bool isActive);
    event CandidateAdded(uint256 id, string name, string party);
    event CandidateRemoved(uint256 id);
    event VoterRegistered(address indexed wallet, string name);
    event VoteCast(address indexed voter, uint256 candidateId);
    event ContractDeployed(address owner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit ContractDeployed(msg.sender);
    }

    // --- Election Config ---
    function setElection(
        string calldata _title,
        uint256 _startTime,
        uint256 _endTime,
        bool _isActive
    ) external onlyOwner {
        require(_endTime > _startTime, "End must be after start");
        election = ElectionConfig(_title, _startTime, _endTime, _isActive);
        emit ElectionSet(_title, _startTime, _endTime, _isActive);
    }

    function getElection() external view returns (
        string memory title,
        uint256 startTime,
        uint256 endTime,
        bool isActive
    ) {
        return (election.title, election.startTime, election.endTime, election.isActive);
    }

    // --- Candidates ---
    function addCandidate(string calldata _name, string calldata _party) external onlyOwner {
        candidateCount++;
        candidates[candidateCount] = Candidate(candidateCount, _name, _party, 0, true);
        candidateIds.push(candidateCount);
        emit CandidateAdded(candidateCount, _name, _party);
    }

    function removeCandidate(uint256 _id) external onlyOwner {
        require(candidates[_id].exists, "Candidate does not exist");
        candidates[_id].exists = false;
        // Remove from array
        for (uint256 i = 0; i < candidateIds.length; i++) {
            if (candidateIds[i] == _id) {
                candidateIds[i] = candidateIds[candidateIds.length - 1];
                candidateIds.pop();
                break;
            }
        }
        emit CandidateRemoved(_id);
    }

    function getCandidate(uint256 _id) external view returns (
        uint256 id, string memory name, string memory party, uint256 voteCount, bool exists
    ) {
        Candidate memory c = candidates[_id];
        return (c.id, c.name, c.party, c.voteCount, c.exists);
    }

    function getCandidateIds() external view returns (uint256[] memory) {
        return candidateIds;
    }

    function getCandidateCount() external view returns (uint256) {
        return candidateIds.length;
    }

    // --- Voters ---
    function registerVoter(
        address _wallet,
        string calldata _name,
        uint256 _age,
        bytes calldata _faceDescriptor
    ) external onlyOwner {
        require(_age >= 18, "Must be 18+");
        require(!voters[_wallet].isRegistered, "Already registered");
        require(_faceDescriptor.length == 512, "Face descriptor must be 512 bytes (128 float32s)");

        voters[_wallet] = Voter({
            name: _name,
            age: _age,
            walletAddress: _wallet,
            faceDescriptor: _faceDescriptor,
            isRegistered: true,
            hasVoted: false
        });
        voterAddresses.push(_wallet);
        emit VoterRegistered(_wallet, _name);
    }

    function getVoter(address _wallet) external view returns (
        string memory name,
        uint256 age,
        address walletAddress,
        bytes memory faceDescriptor,
        bool isRegistered,
        bool hasVoted
    ) {
        Voter memory v = voters[_wallet];
        return (v.name, v.age, v.walletAddress, v.faceDescriptor, v.isRegistered, v.hasVoted);
    }

    function getVoterAddresses() external view returns (address[] memory) {
        return voterAddresses;
    }

    function getVoterCount() external view returns (uint256) {
        return voterAddresses.length;
    }

    // --- Voting ---
    function castVote(uint256 _candidateId) external {
        Voter storage voter = voters[msg.sender];
        require(voter.isRegistered, "Not registered");
        require(!voter.hasVoted, "Already voted");
        require(candidates[_candidateId].exists, "Invalid candidate");
        require(election.isActive, "Election not active");
        require(block.timestamp >= election.startTime, "Election not started");
        require(block.timestamp <= election.endTime, "Election ended");

        voter.hasVoted = true;
        candidates[_candidateId].voteCount++;
        emit VoteCast(msg.sender, _candidateId);
    }

    function isElectionActive() external view returns (bool) {
        return election.isActive &&
            block.timestamp >= election.startTime &&
            block.timestamp <= election.endTime;
    }
}
