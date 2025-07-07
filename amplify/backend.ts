import { defineBackend } from '@aws-amplify/backend';
import { data } from './data/resource';
import { auth } from './auth/resource';
import { CfnIdentityPool, CfnIdentityPoolRoleAttachment } from "aws-cdk-lib/aws-cognito";
import { Role, FederatedPrincipal } from "aws-cdk-lib/aws-iam";

const backend = defineBackend({
  auth,
  data,
});
// 🏗 Создаем новый стек для Cognito
const cognitoStack = backend.createStack("cognito-stack");
// 📌 Создаем Identity Pool
const identityPool = new CfnIdentityPool(cognitoStack, "RPREGuestIdentityPool", {
  allowUnauthenticatedIdentities: true, // Разрешаем гостевой вход
  identityPoolName: "RPREGuestIdentityPool",
});
// 🛠 Создаем роль для неаутентифицированных пользователей
const unauthenticatedRole = new Role(cognitoStack, "UnauthenticatedRole", {
  assumedBy: new FederatedPrincipal(
    "cognito-identity.amazonaws.com",
    {
      StringEquals: { "cognito-identity.amazonaws.com:aud": identityPool.ref },
      "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "unauthenticated" },
    },
    "sts:AssumeRoleWithWebIdentity"
  ),
});

// 🏗 Привязываем роль к Identity Pool
new CfnIdentityPoolRoleAttachment(cognitoStack, "IdentityPoolRoleAttachment", {
  identityPoolId: identityPool.ref,
  roles: {
    unauthenticated: unauthenticatedRole.roleArn,
  },
});