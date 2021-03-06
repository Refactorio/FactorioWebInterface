﻿export enum MessageType {
    Output = "Output",
    Wrapper = "Wrapper",
    Control = "Control",
    Status = "Status",
    Discord = "Discord",
    Error = "Error"
}

export enum FactorioServerStatus {
    Unknown = 'Unknown',
    WrapperStarting = 'WrapperStarting',
    WrapperStarted = 'WrapperStarted',
    Starting = 'Starting',
    Running = 'Running',
    Stopping = 'Stopping',
    Stopped = 'Stopped',
    Killing = 'Killing',
    Killed = 'Killed',
    Crashed = 'Crashed',
    Updating = 'Updating',
    Updated = 'Updated',
    Preparing = 'Preparing',
    Prepared = 'Prepared',
    Errored = 'Errored'
}

export interface MessageData {
    ServerId: string;
    MessageType: MessageType;
    Message: string;
}

export interface FileMetaData {
    Name: string;
    Directory: string;
    CreatedTime: string;
    LastModifiedTime: string;
    Size: number;
}

export class FileMetaData {
    static FriendlyDirectoryName(file: FileMetaData): string {
        switch (file.Directory) {
            case 'saves': return 'Temp Saves';
            case 'local_saves': return 'Local Saves';
            case 'global_saves': return 'Global Saves';
            default: return file.Directory;
        }
    }

    static deflatedName(file: FileMetaData): string {
        let name = file.Name;
        if (name.endsWith('.zip')) {
            name = name.substring(0, name.length - 4);
        }

        return name + '-deflated.zip';
    }
}

export interface ScenarioMetaData {
    Name: string;
    CreatedTime: string;
    LastModifiedTime: string;
}

export interface ModPackMetaData {
    Name: string;
    CreatedTime: string;
    LastModifiedTime: string;
}

export interface ModPackFileMetaData {
    Name: string;
    CreatedTime: string;
    LastModifiedTime: string;
    Size: number;
}

export interface FactorioControlClientData {
    Status: FactorioServerStatus;
    Messages: MessageData[];
}

export interface FactorioServerSettings {
    Name: string;
    Description: string;
    Tags: string[];
    MaxPlayers: number;
    GamePassword: string;
    MaxUploadSlots: number;
    AutoPause: boolean;
    UseDefaultAdmins: boolean;
    Admins: string[];
    AutosaveInterval: number;
    AutosaveSlots: number;
    AfkAutokickInterval: number;
    NonBlockingSaving: boolean;
    PublicVisible: boolean;
}

export type FactorioServerSettingsType = keyof FactorioServerSettings;

export interface FactorioServerExtraSettings {
    SyncBans: boolean;
    BuildBansFromDatabaseOnStart: boolean;
    SetDiscordChannelName: boolean;
    SetDiscordChannelTopic: boolean;
    GameChatToDiscord: boolean;
    GameShoutToDiscord: boolean;
    DiscordToGameChat: boolean;
    PingDiscordCrashRole: boolean;
}

export type FactorioServerExtraSettingsType = keyof FactorioServerExtraSettings;