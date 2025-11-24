package fabric

import (
    "fmt"
    "log"
    "os"
    "path/filepath"

    "github.com/hyperledger/fabric-sdk-go/pkg/core/config"
    "github.com/hyperledger/fabric-sdk-go/pkg/gateway"
)

type Client struct {
    gateway  *gateway.Gateway
    network  *gateway.Network
    contract *gateway.Contract
}

func NewClient(channelName, chaincodeName string) (*Client, error) {
    ccpPath := filepath.Join("..", "network", "connection-org1.yaml")
    
    walletPath := "wallet"
    wallet, err := gateway.NewFileSystemWallet(walletPath)
    if err != nil {
        return nil, fmt.Errorf("failed to create wallet: %w", err)
    }

    if !wallet.Exists("admin") {
        return nil, fmt.Errorf("admin identity not found in wallet")
    }

    gw, err := gateway.Connect(
        gateway.WithConfig(config.FromFile(ccpPath)),
        gateway.WithIdentity(wallet, "admin"),
    )
    if err != nil {
        return nil, fmt.Errorf("failed to connect to gateway: %w", err)
    }

    network, err := gw.GetNetwork(channelName)
    if err != nil {
        gw.Close()
        return nil, fmt.Errorf("failed to get network: %w", err)
    }

    contract := network.GetContract(chaincodeName)

    log.Printf("✅ Connected to Fabric network: channel=%s, chaincode=%s", channelName, chaincodeName)

    return &Client{
        gateway:  gw,
        network:  network,
        contract: contract,
    }, nil
}

func (c *Client) SubmitTransaction(funcName string, args ...string) (string, error) {
    result, err := c.contract.SubmitTransaction(funcName, args...)
    if err != nil {
        return "", fmt.Errorf("failed to submit transaction: %w", err)
    }
    return string(result), nil
}

func (c *Client) EvaluateTransaction(funcName string, args ...string) (string, error) {
    result, err := c.contract.EvaluateTransaction(funcName, args...)
    if err != nil {
        return "", fmt.Errorf("failed to evaluate transaction: %w", err)
    }
    return string(result), nil
}

func (c *Client) Close() {
    if c.gateway != nil {
        c.gateway.Close()
    }
}

