import {type ClientSchema, a, defineData} from "@aws-amplify/backend";
import {generate} from "../functions/generate/resource";

const schema = a.schema({
    Room: a
        .model({
            open: a.boolean(),
            password: a.string(),
            mission: a.string(),
            numberOfVariant: a.integer(),
            model: a.string(),
            players: a.hasMany("Player", "roomId"),
            events: a.hasMany("RoomEvent", "roomId"),
        })
        .authorization((allow) => [allow.publicApiKey()]),
    RoomEvent: a
        .model({
            event: a.string(),

            roomId: a.string(),
            room: a.belongsTo("Room", "roomId"),
            typeId: a.string(),
            type: a.belongsTo("EventType", "typeId"),
        })
        .authorization((allow) => [allow.publicApiKey()]),
    EventType: a
        .model({
            title: a.string(),
            textPrompt: a.string(),
            events: a.hasMany("RoomEvent", "typeId"),
        })
        .authorization((allow) => [allow.publicApiKey()]),
    Player: a
        .model({
            name: a.string(),
            banned: a.boolean().default(false),

            roomId: a.string(),
            room: a.belongsTo("Room", "roomId"),
        })
        .authorization((allow) => [allow.publicApiKey()]),
    Generate: a.query()
        .arguments({
            originPrompt: a.string(),
            model:  a.string(),
        })
        .returns(a.json())
        .handler(a.handler.function(generate))
        .authorization((allow) => [allow.publicApiKey()]),

}).authorization((allow) => [
    allow.resource(generate),
]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
    schema,
    authorizationModes: {
        defaultAuthorizationMode: "apiKey",
        // API Key is used for a.allow.public() rules
        apiKeyAuthorizationMode: {
            expiresInDays: 30,
        },
    },
});