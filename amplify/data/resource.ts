import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { generate } from "../functions/generate/resource";

const schema = a.schema({
    Room: a
        .model({
            open: a.boolean(),
            password: a.string(),
            mission: a.string(),
            numberOfVariant: a.integer(),
            model: a.string(),
            promptSystem: a.string().default('You are an experienced Game Master with a rich imagination, ' +
                'capable of creating exciting and large-scale stories for tabletop role-playing games.'),
            promptWorld: a.string().default('Incredible absurd world'),
            promptRules: a.string().default("Don't write in a standard way, add creativity and a pinch of absurdity. " +
                "Write your answer in Ukrainian. " +
                "Use up to 50 words. " +
                "The result should be only the text of the answer, nothing more. " +
                "Don't use markup and emojis."),
            temperature: a.float().default(2),


            players: a.hasMany("Player", "roomId"),
            events: a.hasMany("RoomEvent", "roomId"),
        })
        .authorization((allow) => [allow.guest()]),
    RoomEvent: a
        .model({
            event: a.string(),
            roomId: a.string(),
            room: a.belongsTo("Room", "roomId"),
            typeId: a.string(),
            type: a.belongsTo("EventType", "typeId"),
        })
        .authorization((allow) => [allow.guest()]),
    EventType: a
        .model({
            title: a.string(),
            textPrompt: a.string(),
            events: a.hasMany("RoomEvent", "typeId"),
        })
        .authorization((allow) => [allow.guest()]),
    Player: a
        .model({
            name: a.string(),
            banned: a.boolean().default(false),

            roomId: a.string(),
            room: a.belongsTo("Room", "roomId"),
        })
        .authorization((allow) => [allow.guest()]),
    Generate: a.query()
        .arguments({
            originPrompt: a.string(),
            model: a.string(),
            systemPrompt: a.string(),
            temperature: a.float(),
        })
        .returns(a.json())
        .handler(a.handler.function(generate))
        .authorization((allow) => [allow.guest()]),

}).authorization((allow) => [
    allow.resource(generate),
]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
    schema,
    authorizationModes: {
        defaultAuthorizationMode: "userPool",
        apiKeyAuthorizationMode: {
            expiresInDays: 30,
        },
    },
});