// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import './Room.sol';

contract RoomCreator {
    Room[] public createdBounties;
    event RoomCreated(Room indexed newRoom);

    function createRoom(string memory _URI) external payable returns (Room) {
        Room newRoom = new Room(msg.sender, _URI);

        createdBounties.push(newRoom);
        emit RoomCreated(newRoom);
        return newRoom;
    }

    function getBounties() external view returns (Room[] memory) {
        return createdBounties;
    }
}
