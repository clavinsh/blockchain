# blockchain

## Development reqs and setup

* Docker
* Docker Compose
* .NET 9.0
* React ???
* Hyperledger Fabric

Set up Hyperledger Fabric Test network:
https://github.com/hyperledger/fabric-samples.git

Download and set up prerequisites
```bash
./network.sh prereq
./network.sh up createChannel -ca
```
Verify succesfull channel creation:

```bash
$ docker exec peer0.org1.example.com peer channel list
2025-11-03 18:53:29.602 UTC 0001 INFO [channelCmd] InitCmdFactory -> Endorser and orderer connections initialized
Channels peers has joined: 
mychannel
```
