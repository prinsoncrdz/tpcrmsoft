# ============================================================================
# TURNING POINT RETAIL SOLUTIONS - TERRAFORM VARIABLES
# File: terraform/variables.tf
# ============================================================================

variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS region for deployment"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Environment name (production/staging)"
}

variable "project_name" {
  type        = string
  default     = "turning-point-crm"
  description = "Project name prefix"
}
