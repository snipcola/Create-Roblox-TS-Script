import Vide, { mount } from "@rbxts/vide";
import App from "./app";

const { LocalPlayer } = game.GetService("Players");
const GUI = gethui ? gethui() : LocalPlayer.FindFirstChildOfClass("PlayerGui");

mount(() => <App />, GUI);
