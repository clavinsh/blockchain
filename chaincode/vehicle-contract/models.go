package main

import "time"

type Vehicle struct {
    OnChainID    string    `json:"onChainId"`
    VIN          string    `json:"vin"`
    OwnerUserID  string    `json:"ownerUserId"`
    RegisteredAt time.Time `json:"registeredAt"`
}

type DataHash struct {
    OnChainID string    `json:"onChainId"`
    Hash      string    `json:"hash"`
    Timestamp time.Time `json:"timestamp"`
}

type AccessGrant struct {
    OnChainID   string    `json:"onChainId"`
    GrantedTo   string    `json:"grantedTo"`
    GrantedAt   time.Time `json:"grantedAt"`
    ExpiresAt   time.Time `json:"expiresAt"`
}

