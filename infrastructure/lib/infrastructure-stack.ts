import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
 
export class InfrastructureStack extends cdk.Stack {
 constructor(scope: Construct, id: string, props?: cdk.StackProps) {
   super(scope, id, props);
 
   // ─────────────────────────────────────────
   // 1. BASE DE DATOS (DynamoDB)
   // ─────────────────────────────────────────
   const table = new dynamodb.Table(this, "MainTable", {
     tableName: "ticketpro-main-dev",
     // La clave principal: PK = tipo de dato (ej: "EVENT#123")
     partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
     // La clave secundaria: SK = subtipo (ej: "METADATA")
     sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
     // PAY_PER_REQUEST = pagas solo por lo que usas (ideal para empezar)
     billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
     // PITR = puedes recuperar datos de hasta 35 dias atras
     pointInTimeRecovery: true,
     // Eliminar la tabla si eliminas el stack (solo en dev)
     removalPolicy: cdk.RemovalPolicy.DESTROY,
   });
 
   // Indice adicional para buscar eventos por categoria y ciudad
   table.addGlobalSecondaryIndex({
     indexName: "GSI-busqueda",
     partitionKey: { name: "GSI-PK", type: dynamodb.AttributeType.STRING },
     sortKey: { name: "GSI-SK", type: dynamodb.AttributeType.STRING },
   });
 
   // ─────────────────────────────────────────
   // 2. AUTENTICACION (Cognito)
   // ─────────────────────────────────────────
   const userPool = new cognito.UserPool(this, "UserPool", {
     userPoolName: "ticketpro-users-dev",
     selfSignUpEnabled: true,
     signInAliases: { email: true },
     autoVerify: { email: true },
     passwordPolicy: {
       minLength: 8,
       requireLowercase: true,
       requireUppercase: true,
       requireDigits: true,
     },
     removalPolicy: cdk.RemovalPolicy.DESTROY,
   });
 
   const userPoolClient = userPool.addClient("WebClient", {
     authFlows: { userPassword: true, userSrp: true },
   });
 
   // ─────────────────────────────────────────
   // 3. OUTPUTS: valores que necesitaremos despues
   // ─────────────────────────────────────────
   new cdk.CfnOutput(this, "TableName", {
     value: table.tableName,
     description: "Nombre de la tabla DynamoDB",
   });
   new cdk.CfnOutput(this, "UserPoolId", {
     value: userPool.userPoolId,
     description: "ID del User Pool de Cognito",
   });
   new cdk.CfnOutput(this, "UserPoolClientId", {
     value: userPoolClient.userPoolClientId,
     description: "ID del cliente web de Cognito",
   });
 }
}