# ============================================================================
# TURNING POINT RETAIL SOLUTIONS - TERRAFORM OUTPUTS
# File: terraform/outputs.tf
# ============================================================================

output "api_gateway_endpoint" {
  value       = aws_apigatewayv2_api.http_api.api_endpoint
  description = "Base URL of the deployed AWS API Gateway HTTP API"
}

output "s3_assets_bucket_name" {
  value       = aws_s3_bucket.crm_assets.bucket
  description = "Name of the created S3 assets bucket"
}

output "frontend_bucket_name" {
  value       = aws_s3_bucket.frontend_bucket.bucket
  description = "Name of the created S3 bucket for frontend hosting"
}

output "frontend_website_url" {
  value       = "http://${aws_s3_bucket_website_configuration.frontend_website.website_endpoint}"
  description = "Public URL for hosted Turning Point CRM Web App"
}

output "petty_cash_table_name" {
  value       = aws_dynamodb_table.petty_cash.name
  description = "DynamoDB table for Petty Cash transactions"
}

output "projects_table_name" {
  value       = aws_dynamodb_table.projects.name
  description = "DynamoDB table for CRM Projects"
}
