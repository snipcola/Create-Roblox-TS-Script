import XLib from "./xlib/xlib";
import { Players } from "@rbxts/services";
const LocalPlayer = Players.LocalPlayer;

function CreateNotification(
  Title: string,
  Description: string,
  RemoveIn: number,
) {
  XLib.CreateNotification({ Title, Description, RemoveIn });
}

function GetPlayerPrimaryPart(Player: Player): BasePart | undefined {
  return Player.Character?.PrimaryPart;
}

function GetPlayerCFrame(Player: Player): CFrame | undefined {
  return GetPlayerPrimaryPart(Player)?.CFrame;
}

function Teleport(BasePart: BasePart, Two: CFrame) {
  BasePart.CFrame = Two;
}

for (const Player of Players.GetPlayers()) {
  if (Player === LocalPlayer) continue;

  const LocalPlayerPrimaryPart = GetPlayerPrimaryPart(LocalPlayer);
  const PlayerCFrame = GetPlayerCFrame(Player);

  if (LocalPlayerPrimaryPart && PlayerCFrame) {
    Teleport(LocalPlayerPrimaryPart, PlayerCFrame);
    CreateNotification("Roblox TS", `Teleported to ${Player.Name}!`, 2.5);
    task.wait(2.5);
  }
}