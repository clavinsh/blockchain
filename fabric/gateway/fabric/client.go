package fabric

import (
	"crypto/x509"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/hyperledger/fabric-gateway/pkg/client"
	"github.com/hyperledger/fabric-gateway/pkg/identity"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
)

type Client struct {
	grpcConn *grpc.ClientConn
	gateway  *client.Gateway
	contract *client.Contract
}

func NewClient(channelName, chaincodeName string) (*Client, error) {
	// Paths - these are relative to /app in the container
	cryptoPath := "/app/organizations/peerOrganizations/org1.example.com"
	certPath := filepath.Join(cryptoPath, "users", "Admin@org1.example.com", "msp", "signcerts", "Admin@org1.example.com-cert.pem")
	keyDir := filepath.Join(cryptoPath, "users", "Admin@org1.example.com", "msp", "keystore")
	tlsCertPath := filepath.Join(cryptoPath, "peers", "peer0.org1.example.com", "tls", "ca.crt")

	peerEndpoint := "peer0.org1.example.com:7051"
	gatewayPeer := "peer0.org1.example.com"

	// Load credentials
	certificate, err := loadCertificate(certPath)
	if err != nil {
		return nil, fmt.Errorf("failed to load certificate: %w", err)
	}

	id, err := identity.NewX509Identity("Org1MSP", certificate)
	if err != nil {
		return nil, fmt.Errorf("failed to create identity: %w", err)
	}

	privateKey, err := loadPrivateKey(keyDir)
	if err != nil {
		return nil, fmt.Errorf("failed to load private key: %w", err)
	}

	sign, err := identity.NewPrivateKeySign(privateKey)
	if err != nil {
		return nil, fmt.Errorf("failed to create signer: %w", err)
	}

	// Create gRPC connection
	tlsCert, err := os.ReadFile(tlsCertPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read TLS cert: %w", err)
	}

	certPool := x509.NewCertPool()
	if !certPool.AppendCertsFromPEM(tlsCert) {
		return nil, fmt.Errorf("failed to add TLS cert to pool")
	}

	transportCredentials := credentials.NewClientTLSFromCert(certPool, gatewayPeer)
	grpcConn, err := grpc.Dial(peerEndpoint,
		grpc.WithTransportCredentials(transportCredentials),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create gRPC connection: %w", err)
	}

	// Create gateway
	gw, err := client.Connect(
		id,
		client.WithSign(sign),
		client.WithClientConnection(grpcConn),
		client.WithEvaluateTimeout(5*time.Second),
		client.WithEndorseTimeout(15*time.Second),
		client.WithSubmitTimeout(5*time.Second),
		client.WithCommitStatusTimeout(1*time.Minute),
	)
	if err != nil {
		grpcConn.Close()
		return nil, fmt.Errorf("failed to connect gateway: %w", err)
	}

	network := gw.GetNetwork(channelName)
	contract := network.GetContract(chaincodeName)

	log.Printf("Connected to Fabric network: channel=%s, chaincode=%s", channelName, chaincodeName)

	return &Client{
		grpcConn: grpcConn,
		gateway:  gw,
		contract: contract,
	}, nil
}

func loadCertificate(certPath string) (*x509.Certificate, error) {
	certPEM, err := os.ReadFile(certPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read certificate file: %w", err)
	}
	return identity.CertificateFromPEM(certPEM)
}

func loadPrivateKey(keyDir string) (interface{}, error) {
	files, err := os.ReadDir(keyDir)
	if err != nil {
		return nil, fmt.Errorf("failed to read keystore directory: %w", err)
	}

	for _, f := range files {
		if !f.IsDir() {
			keyPath := filepath.Join(keyDir, f.Name())
			keyPEM, err := os.ReadFile(keyPath)
			if err != nil {
				continue
			}
			privateKey, err := identity.PrivateKeyFromPEM(keyPEM)
			if err != nil {
				continue
			}
			return privateKey, nil
		}
	}
	return nil, fmt.Errorf("no private key found in %s", keyDir)
}

func (c *Client) SubmitTransaction(funcName string, args ...string) (string, error) {
	log.Printf("Submitting transaction: %s with %d args", funcName, len(args))

	result, err := c.contract.SubmitTransaction(funcName, args...)
	if err != nil {
		return "", fmt.Errorf("failed to submit transaction %s: %w", funcName, err)
	}

	log.Printf("Transaction %s submitted successfully", funcName)
	return string(result), nil
}

func (c *Client) EvaluateTransaction(funcName string, args ...string) (string, error) {
	log.Printf("Evaluating transaction: %s with %d args", funcName, len(args))

	result, err := c.contract.EvaluateTransaction(funcName, args...)
	if err != nil {
		return "", fmt.Errorf("failed to evaluate transaction %s: %w", funcName, err)
	}

	return string(result), nil
}

func (c *Client) Close() {
	log.Println("Closing Fabric gateway connection")
	if c.gateway != nil {
		c.gateway.Close()
	}
	if c.grpcConn != nil {
		c.grpcConn.Close()
	}
}
