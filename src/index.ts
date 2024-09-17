import XLib from "./xlib";

const Players = game.GetService("Players");
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

let InitialCFrame;
let LocalPlayerPrimaryPart = GetPlayerPrimaryPart(LocalPlayer);

if (LocalPlayerPrimaryPart) {
  InitialCFrame = LocalPlayerPrimaryPart.CFrame;
}

for (const Player of Players.GetPlayers()) {
  if (Player === LocalPlayer) continue;

  const LocalPlayerPrimaryPart = GetPlayerPrimaryPart(LocalPlayer);
  const PlayerCFrame = GetPlayerCFrame(Player);

  if (LocalPlayerPrimaryPart && PlayerCFrame) {
    Teleport(LocalPlayerPrimaryPart, PlayerCFrame);
    CreateNotification("Roblox TS", `Teleported to ${Player.Name}!`, 0.75);
    task.wait(0.75);
  }
}

LocalPlayerPrimaryPart = GetPlayerPrimaryPart(LocalPlayer);

if (LocalPlayerPrimaryPart && InitialCFrame) {
  CreateNotification("Roblox TS", `Teleported to Initial Position!`, 3);
  Teleport(LocalPlayerPrimaryPart, InitialCFrame);
}
