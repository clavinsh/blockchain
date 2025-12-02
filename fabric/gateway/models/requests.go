package models

type RegisterVehicleRequest struct {
    OnChainID   string `json:"onChainId" binding:"required"`
    VIN         string `json:"vin" binding:"required"`
    OwnerUserID string `json:"ownerUserId" binding:"required"`
}

type SubmitHashRequest struct {
    OnChainID string `json:"onChainId" binding:"required"`
    DataHash  string `json:"dataHash" binding:"required"`
}

type GrantAccessRequest struct {
    OnChainID          string `json:"onChainId" binding:"required"`
    InsuranceCompanyID string `json:"insuranceCompanyId" binding:"required"`
    DurationDays       int    `json:"durationDays" binding:"required,min=1"`
}

type Response struct {
    Success bool   `json:"success"`
    Result  string `json:"result,omitempty"`
    TxID    string `json:"txId,omitempty"`
    Error   string `json:"error,omitempty"`
}

