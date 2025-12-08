package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type VehicleContract struct {
	contractapi.Contract
}

func (c *VehicleContract) RegisterVehicle(
	ctx contractapi.TransactionContextInterface,
	onChainID string,
	vin string,
	ownerUserID string,
) error {
	vehicle := Vehicle{
		OnChainID:    onChainID,
		VIN:          vin,
		OwnerUserID:  ownerUserID,
		RegisteredAt: time.Now(),
	}

	vehicleJSON, err := json.Marshal(vehicle)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(onChainID, vehicleJSON)
}

func (c *VehicleContract) ReadVehicle(
	ctx contractapi.TransactionContextInterface,
	onChainID string,
) (*Vehicle, error) {
	vehicleJSON, err := ctx.GetStub().GetState(onChainID)
	if err != nil {
		return nil, err
	}
	if vehicleJSON == nil {
		return nil, fmt.Errorf("vehicle not found")
	}

	var vehicle Vehicle
	err = json.Unmarshal(vehicleJSON, &vehicle)
	return &vehicle, err
}

func (c *VehicleContract) SubmitDataHash(
	ctx contractapi.TransactionContextInterface,
	onChainID string,
	hash string,
) error {
	dataHash := DataHash{
		OnChainID: onChainID,
		Hash:      hash,
		Timestamp: time.Now(),
	}

	hashJSON, err := json.Marshal(dataHash)
	if err != nil {
		return err
	}

	key := fmt.Sprintf("hash~%s~%d", onChainID, time.Now().Unix())
	return ctx.GetStub().PutState(key, hashJSON)
}

func (c *VehicleContract) GrantAccess(
	ctx contractapi.TransactionContextInterface,
	onChainID string,
	grantedTo string,
	durationDays int,
) error {
	access := AccessGrant{
		OnChainID: onChainID,
		GrantedTo: grantedTo,
		GrantedAt: time.Now(),
		ExpiresAt: time.Now().AddDate(0, 0, durationDays),
	}

	accessJSON, err := json.Marshal(access)
	if err != nil {
		return err
	}

	key := fmt.Sprintf("access~%s~%s", onChainID, grantedTo)
	return ctx.GetStub().PutState(key, accessJSON)
}

func (c *VehicleContract) ReadAccess(
	ctx contractapi.TransactionContextInterface,
	onChainID string,
	grantedTo string,
) (*AccessGrant, error) {
	key := fmt.Sprintf("access~%s~%s", onChainID, grantedTo)

	accessJSON, err := ctx.GetStub().GetState(key)
	if err != nil {
		return nil, err
	}
	if accessJSON == nil {
		return nil, nil
	}

	var access AccessGrant
	err = json.Unmarshal(accessJSON, &access)
	return &access, err
}
