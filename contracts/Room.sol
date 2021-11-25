// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Room {
    enum State {
        PENDING,
        APPROVED,
        REJECTED
    }

    struct Proposal {
        bytes32 id;
        address creator;
        string uri;
        uint256 amount;
        State state;
    }

    event Transfer(address indexed from, address indexed to, uint256 value);
    event SubmitProposal(Proposal proposal);
    event Approve(uint256 amount, bytes32 proposalId);
    event Reject(bytes32 proposalId);
    uint256 randNonce = 0;

    function rand() internal returns (bytes32) {
        randNonce++;
        return keccak256(abi.encodePacked(block.timestamp, msg.sender, randNonce));
    }

    mapping(address => uint256) public balances;

    mapping(address => bytes32[]) public contributorProposals;

    mapping(bytes32 => address) public proposalToContributor;

    mapping(bytes32 => Proposal) public proposals;

    bytes32[] public allProposals;

    string URI;

    address creator;

    constructor(address _creator, string memory _URI) {
        creator = _creator;
        URI = _URI;
    }

    function getURI() public view returns (string memory) {
        return URI;
    }

    function approveProposal(bytes32 proposalId) public {
        require(proposalId.length > 0, 'proposalId length should be higher than 0');
        Proposal memory proposal = proposals[proposalId];
        require(proposal.state == State.PENDING, 'Only PENDING proposals can be approved');
        uint256 amount = proposals[proposalId].amount;
        require(amount <= balances[msg.sender], 'msg.sender blance too low');
        address contributorAddress = proposalToContributor[proposalId];
        balances[msg.sender] -= amount;
        balances[contributorAddress] += amount;
        proposals[proposalId].state = State.APPROVED;
        emit Approve(amount, proposalId);
    }

    function rejectProposal(bytes32 proposalId) public {
        require(proposalId.length > 0, 'proposalId length should be higher than 0');
        Proposal memory proposal = proposals[proposalId];
        require(proposal.state == State.PENDING, 'Only PENDING proposals can be approved');
        proposals[proposalId].state = State.REJECTED;
        emit Reject(proposalId);
    }

    function submitProposal(string memory _uri, uint256 _amount) public {
        require(_amount > 0, '_amount should be higher than 0');
        require(bytes(_uri).length > 0, '_uri must not be empty');
        bytes32 proposalId = rand();
        allProposals.push(proposalId);
        proposals[proposalId] = Proposal(proposalId, msg.sender, _uri, _amount, State.PENDING);
        contributorProposals[msg.sender].push(proposalId);
        proposalToContributor[proposalId] = msg.sender;
        emit SubmitProposal(Proposal(proposalId, msg.sender, _uri, _amount, State.PENDING));
    }

    function getProposal(bytes32 _proposalId) public view returns (Proposal memory) {
        return proposals[_proposalId];
    }

    function getMyProposals() public view returns (bytes32[] memory) {
        return contributorProposals[msg.sender];
    }

    function getProposals() public view returns (bytes32[] memory) {
        return allProposals;
    }

    function deposit() external payable {
        require(msg.value > 0, 'amount should be non null');
        balances[msg.sender] += msg.value;
        emit Transfer(msg.sender, address(this), msg.value);
    }

    function withdraw(uint256 _amount) external {
        require(_amount <= balances[msg.sender], 'withdrawal _amount cannot be higher than sender balance');
        (bool success, ) = msg.sender.call{value: _amount}('');
        balances[msg.sender] -= _amount;
        require(success, 'Transfer failed.');

        emit Transfer(address(this), msg.sender, _amount);
    }

    function getDeposit() external view returns (uint256) {
        return balances[msg.sender];
    }

    function emergencyWithdrawal() public {
        require(msg.sender == creator, 'only the room creator can withdraw');
        uint256 amount = address(this).balance;
        (bool success, ) = msg.sender.call{value: amount}('');
        require(success, 'Transfer failed.');
        emit Transfer(address(this), msg.sender, amount);
    }
}
