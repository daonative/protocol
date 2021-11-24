// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import './Room.sol';

contract RoomCreator {
    Room[] public allRooms;
    event RoomCreated(address indexed newRoom);

    function createRoom(string memory _URI) external returns (Room) {
        Room newRoom = new Room(msg.sender, _URI);
        emit RoomCreated(address(newRoom));
        allRooms.push(newRoom);
        return newRoom;
    }

    function getRooms() external view returns (Room[] memory) {
        return allRooms;
    }
}
