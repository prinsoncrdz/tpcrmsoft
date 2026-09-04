# ============================================================================
# TURNING POINT RETAIL SOLUTIONS - AWS TERRAFORM INFRASTRUCTURE AS CODE
# File: terraform/main.tf
# ============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ----------------------------------------------------------------------------
# 1. AMAZON DYNAMODB TABLES (PAY-PER-REQUEST)
# ----------------------------------------------------------------------------

resource "aws_dynamodb_table" "petty_cash" {
  name         = "TurningPoint_PettyCash"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "projects" {
  name         = "TurningPoint_Projects"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "friday_reports" {
  name         = "TurningPoint_FridayReports"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "pnl" {
  name         = "TurningPoint_PnL"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "chat" {
  name         = "TurningPoint_Chat"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# ----------------------------------------------------------------------------
# 2. AMAZON S3 ASSETS BUCKET
# ----------------------------------------------------------------------------

resource "aws_s3_bucket" "crm_assets" {
  bucket_prefix = "turningpoint-crm-assets-"
  force_destroy = true

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_s3_bucket_cors_configuration" "crm_assets_cors" {
  bucket = aws_s3_bucket.crm_assets.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = ["*"]
    max_age_seconds = 3000
  }
}

# ----------------------------------------------------------------------------
# 3. IAM EXECUTION ROLE & POLICIES FOR LAMBDAS
# ----------------------------------------------------------------------------

resource "aws_iam_role" "lambda_exec_role" {
  name = "turningpoint_crm_lambda_exec_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_policy" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_policy" "lambda_dynamodb_s3_policy" {
  name        = "turningpoint_crm_lambda_dynamodb_s3_policy"
  description = "Allows Lambdas to access DynamoDB tables and S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          aws_dynamodb_table.petty_cash.arn,
          aws_dynamodb_table.projects.arn,
          aws_dynamodb_table.friday_reports.arn,
          aws_dynamodb_table.pnl.arn,
          aws_dynamodb_table.chat.arn,
          "${aws_dynamodb_table.petty_cash.arn}/*",
          "${aws_dynamodb_table.projects.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.crm_assets.arn}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_custom_attachment" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = aws_iam_policy.lambda_dynamodb_s3_policy.arn
}

# ----------------------------------------------------------------------------
# 4. LAMBDA SOURCE ZIP ARCHIVES
# ----------------------------------------------------------------------------

data "archive_file" "petty_cash_zip" {
  type        = "zip"
  source_file = "${path.module}/../aws/lambdas/handlePettyCash.js"
  output_path = "${path.module}/petty_cash.zip"
}

data "archive_file" "projects_zip" {
  type        = "zip"
  source_file = "${path.module}/../aws/lambdas/handleProjects.js"
  output_path = "${path.module}/projects.zip"
}

data "archive_file" "friday_reports_zip" {
  type        = "zip"
  source_file = "${path.module}/../aws/lambdas/handleFridayReports.js"
  output_path = "${path.module}/friday_reports.zip"
}

data "archive_file" "pnl_zip" {
  type        = "zip"
  source_file = "${path.module}/../aws/lambdas/handlePnL.js"
  output_path = "${path.module}/pnl.zip"
}

data "archive_file" "chat_zip" {
  type        = "zip"
  source_file = "${path.module}/../aws/lambdas/handleChat.js"
  output_path = "${path.module}/chat.zip"
}

# ----------------------------------------------------------------------------
# 5. AWS LAMBDA FUNCTIONS (NODE.JS 20.X)
# ----------------------------------------------------------------------------

resource "aws_lambda_function" "handle_petty_cash" {
  filename         = data.archive_file.petty_cash_zip.output_path
  function_name    = "TurningPoint_HandlePettyCash"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "handlePettyCash.handler"
  runtime          = "nodejs20.x"
  source_code_hash = data.archive_file.petty_cash_zip.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.petty_cash.name
      S3_BUCKET      = aws_s3_bucket.crm_assets.bucket
    }
  }
}

resource "aws_lambda_function" "handle_projects" {
  filename         = data.archive_file.projects_zip.output_path
  function_name    = "TurningPoint_HandleProjects"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "handleProjects.handler"
  runtime          = "nodejs20.x"
  source_code_hash = data.archive_file.projects_zip.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.projects.name
    }
  }
}

resource "aws_lambda_function" "handle_friday_reports" {
  filename         = data.archive_file.friday_reports_zip.output_path
  function_name    = "TurningPoint_HandleFridayReports"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "handleFridayReports.handler"
  runtime          = "nodejs20.x"
  source_code_hash = data.archive_file.friday_reports_zip.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.friday_reports.name
    }
  }
}

resource "aws_lambda_function" "handle_pnl" {
  filename         = data.archive_file.pnl_zip.output_path
  function_name    = "TurningPoint_HandlePnL"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "handlePnL.handler"
  runtime          = "nodejs20.x"
  source_code_hash = data.archive_file.pnl_zip.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.pnl.name
    }
  }
}

resource "aws_lambda_function" "handle_chat" {
  filename         = data.archive_file.chat_zip.output_path
  function_name    = "TurningPoint_HandleChat"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "handleChat.handler"
  runtime          = "nodejs20.x"
  source_code_hash = data.archive_file.chat_zip.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.chat.name
    }
  }
}

# ----------------------------------------------------------------------------
# 6. AMAZON API GATEWAY (HTTP API V2)
# ----------------------------------------------------------------------------

resource "aws_apigatewayv2_api" "http_api" {
  name          = "TurningPoint_CRM_API"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_stage" "default_stage" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

# API Gateway Lambda Integrations
resource "aws_apigatewayv2_integration" "petty_cash_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.handle_petty_cash.invoke_arn
}

resource "aws_apigatewayv2_integration" "projects_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.handle_projects.invoke_arn
}

resource "aws_apigatewayv2_integration" "friday_reports_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.handle_friday_reports.invoke_arn
}

resource "aws_apigatewayv2_integration" "pnl_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.handle_pnl.invoke_arn
}

resource "aws_apigatewayv2_integration" "chat_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.handle_chat.invoke_arn
}

# API Gateway Routes
resource "aws_apigatewayv2_route" "petty_cash_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /petty-cash"
  target    = "integrations/${aws_apigatewayv2_integration.petty_cash_integration.id}"
}

resource "aws_apigatewayv2_route" "projects_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /projects"
  target    = "integrations/${aws_apigatewayv2_integration.projects_integration.id}"
}

resource "aws_apigatewayv2_route" "friday_reports_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /friday-reports"
  target    = "integrations/${aws_apigatewayv2_integration.friday_reports_integration.id}"
}

resource "aws_apigatewayv2_route" "pnl_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /pnl"
  target    = "integrations/${aws_apigatewayv2_integration.pnl_integration.id}"
}

resource "aws_apigatewayv2_route" "chat_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /chat"
  target    = "integrations/${aws_apigatewayv2_integration.chat_integration.id}"
}

# Lambda Permissions for API Gateway Invocation
resource "aws_lambda_permission" "petty_cash_perm" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.handle_petty_cash.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "projects_perm" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.handle_projects.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "friday_reports_perm" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.handle_friday_reports.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "pnl_perm" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.handle_pnl.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "chat_perm" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.handle_chat.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}
