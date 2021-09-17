// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import './Bounty.sol';

contract BountyCreator {
    Bounty[] public createdBounties;
    event BountyCreated(Bounty indexed newBounty);

    function createBounty(string memory _URI) external payable returns (Bounty) {
        Bounty newBounty = new Bounty(msg.sender, _URI);

        createdBounties.push(newBounty);
        emit BountyCreated(newBounty);
        return newBounty;
    }

    function getBounties() external view returns (Bounty[] memory) {
        return createdBounties;
    }
}
