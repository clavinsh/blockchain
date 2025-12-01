package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"

	"github.com/hyperledger/fabric-sdk-go/pkg/gateway"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run setup-wallet.go <path-to-fabric-samples>")
		fmt.Println()
		fmt.Println("Example:")
		fmt.Println("  go run setup-wallet.go ~/programming/blockchain/fabric-samples")
		os.Exit(1)
	}

	fabricSamples := os.Args[1]
	testNetwork := filepath.Join(fabricSamples, "test-network")

	log.Println("🔧 Setting up Fabric wallet...")
	log.Printf("Using fabric-samples at: %s\n", fabricSamples)

	certPath := filepath.Join(testNetwork, "organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/cert.pem")
	keyDir := filepath.Join(testNetwork, "organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore")

	if _, err := os.Stat(certPath); os.IsNotExist(err) {
		log.Fatalf("Certificate not found at: %s\n\nMake sure network is running with:\n  cd %s\n  ./network.sh up createChannel -ca", certPath, testNetwork)
	}

	cert, err := ioutil.ReadFile(certPath)
	if err != nil {
		log.Fatalf("Failed to read certificate: %v", err)
	}
	log.Printf("✅ Found certificate: %s\n", filepath.Base(certPath))

	files, err := ioutil.ReadDir(keyDir)
	if err != nil {
		log.Fatalf("Failed to read keystore: %v", err)
	}

	var keyPath string
	for _, file := range files {
		name := file.Name()
		// Look for files ending in _sk
		if len(name) > 3 && name[len(name)-3:] == "_sk" {
			keyPath = filepath.Join(keyDir, name)
			break
		}
	}

	if keyPath == "" {
		log.Fatalf("Private key not found in: %s", keyDir)
	}

	key, err := ioutil.ReadFile(keyPath)
	if err != nil {
		log.Fatalf("Failed to read private key: %v", err)
	}
	log.Printf("Found private key: %s\n", filepath.Base(keyPath))

	walletPath := "wallet"
	
	if _, err := os.Stat(walletPath); !os.IsNotExist(err) {
		log.Println("Removing existing wallet...")
		os.RemoveAll(walletPath)
	}

	wallet, err := gateway.NewFileSystemWallet(walletPath)
	if err != nil {
		log.Fatalf("Failed to create wallet: %v", err)
	}

	identity := gateway.NewX509Identity("Org1MSP", string(cert), string(key))
	
	err = wallet.Put("admin", identity)
	if err != nil {
		log.Fatalf("Failed to put identity in wallet: %v", err)
	}

	log.Println()
	log.Println("✅ Wallet created successfully!")
	log.Printf("Wallet location: %s\n", walletPath)
	log.Println()

	if wallet.Exists("admin") {
		log.Println("✅ Verified: admin identity exists in wallet")
		log.Println()
		log.Println("You can now run:")
		log.Println("  go run main.go")
		log.Println()
	} else {
		log.Fatal("Verification failed: admin identity not found")
	}
}

