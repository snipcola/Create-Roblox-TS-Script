import Vide from "@rbxts/vide";

export default function App() {
  return (
    <screengui>
      <textlabel
        Text={"Hello, world!"}
        TextSize={200}
        Font={Enum.Font.Arial}
        TextColor3={Color3.fromRGB(255, 255, 255)}
        Size={new UDim2(1, 0, 1, 0)}
        BackgroundColor3={Color3.fromRGB(0, 0, 0)}
      />
    </screengui>
  );
}
