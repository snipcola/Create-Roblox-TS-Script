repeat
	task.wait()
until game:IsLoaded()

local CoreGui = game:GetService("CoreGui")

if CoreGui:FindFirstChild("XAlerts") then
	CoreGui.XAlerts:Destroy()
	task.wait()
end

local XAlerts = Instance.new("ScreenGui")
local XNotifications = Instance.new("Frame")
local UIPadding = Instance.new("UIPadding")
local UIListLayout = Instance.new("UIListLayout")

local function CreateFakeScript(Func)
	coroutine.wrap(Func)()
end

local XLib = {}

XLib.CreateAlert = function(Info)
	local XAlert = Instance.new("Frame")
	local UICorner = Instance.new("UICorner")
	local Title = Instance.new("TextLabel")
	local UIPadding = Instance.new("UIPadding")
	local Description = Instance.new("TextLabel")
	local UIPadding_2 = Instance.new("UIPadding")
	local UIListLayout = Instance.new("UIListLayout")
	local Divider = Instance.new("Frame")
	local Buttons = Instance.new("Frame")
	local UICorner_2 = Instance.new("UICorner")
	local Button1 = Instance.new("Frame")
	local Disabled = Instance.new("BoolValue")
	local UICorner_3 = Instance.new("UICorner")
	local Text = Instance.new("TextLabel")
	local Corner1 = Instance.new("Frame")
	local Corner2 = Instance.new("Frame")
	local Divider_2 = Instance.new("Frame")
	local Button2 = Instance.new("Frame")
	local Disabled_2 = Instance.new("BoolValue")
	local UICorner_4 = Instance.new("UICorner")
	local Text_2 = Instance.new("TextLabel")
	local Corner2_2 = Instance.new("Frame")
	local Corner1_2 = Instance.new("Frame")

	XAlert.Name = "XAlert"
	XAlert.Parent = XAlerts
	XAlert.AnchorPoint = Vector2.new(0.5, 0.5)
	XAlert.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	XAlert.BorderSizePixel = 0
	XAlert.ClipsDescendants = true
	XAlert.Position = UDim2.new(0.5, 0, 0.5, 0)
	XAlert.Size = UDim2.new(0, 250, 0, 0)
	XAlert.Visible = false
	XAlert.AutomaticSize = Enum.AutomaticSize.Y

	UICorner.Parent = XAlert

	UIListLayout.Parent = XAlert
	UIListLayout.SortOrder = Enum.SortOrder.LayoutOrder
	UIListLayout.VerticalAlignment = Enum.VerticalAlignment.Bottom

	Title.Name = "Title"
	Title.Parent = XAlert
	Title.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	Title.BackgroundTransparency = 1.000
	Title.BorderSizePixel = 0
	Title.Size = UDim2.new(1, 0, 0, 0)
	Title.Font = Enum.Font.SourceSansBold
	Title.Text = ""
	Title.TextColor3 = Color3.fromRGB(45, 45, 45)
	Title.TextSize = 18.000
	Title.AutomaticSize = Enum.AutomaticSize.Y

	UIPadding.Parent = Title
	UIPadding.PaddingBottom = UDim.new(0, 5)
	UIPadding.PaddingLeft = UDim.new(0, 20)
	UIPadding.PaddingRight = UDim.new(0, 20)
	UIPadding.PaddingTop = UDim.new(0, 15)

	Description.Name = "Description"
	Description.Parent = XAlert
	Description.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	Description.BackgroundTransparency = 1.000
	Description.BorderSizePixel = 0
	Description.Size = UDim2.new(1, 0, 0, 0)
	Description.Font = Enum.Font.SourceSans
	Description.Text = ""
	Description.TextColor3 = Color3.fromRGB(45, 45, 45)
	Description.TextSize = 18.000
	Description.TextWrapped = true
	Description.AutomaticSize = Enum.AutomaticSize.Y

	UIPadding_2.Parent = Description
	UIPadding_2.PaddingBottom = UDim.new(0, 15)
	UIPadding_2.PaddingLeft = UDim.new(0, 20)
	UIPadding_2.PaddingRight = UDim.new(0, 20)

	Divider.Name = "Divider"
	Divider.Parent = XAlert
	Divider.BackgroundColor3 = Color3.fromRGB(235, 235, 235)
	Divider.BorderSizePixel = 0
	Divider.Size = UDim2.new(1, 0, 0, 1)

	Buttons.Name = "Buttons"
	Buttons.Parent = XAlert
	Buttons.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	Buttons.BorderSizePixel = 0
	Buttons.Size = UDim2.new(1, 0, 0, 35)

	UICorner_2.Parent = Buttons

	Button1.Name = "Button1"
	Button1.Parent = Buttons
	Button1.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	Button1.BorderSizePixel = 0
	Button1.Size = UDim2.new(0, 124, 1, 0)

	Disabled.Name = "Disabled"
	Disabled.Parent = Button1

	UICorner_3.Parent = Button1

	Text.Name = "Text"
	Text.Parent = Button1
	Text.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	Text.BackgroundTransparency = 1.000
	Text.BorderSizePixel = 0
	Text.Size = UDim2.new(1, 0, 1, 0)
	Text.Font = Enum.Font.Arial
	Text.Text = ""
	Text.TextColor3 = Color3.fromRGB(35, 140, 254)
	Text.TextSize = 15.000

	Corner1.Name = "Corner1"
	Corner1.Parent = Button1
	Corner1.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	Corner1.BorderSizePixel = 0
	Corner1.Position = UDim2.new(0, 116, 0, 0)
	Corner1.Size = UDim2.new(0, 10, 1, 0)

	Corner2.Name = "Corner2"
	Corner2.Parent = Button1
	Corner2.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	Corner2.BorderSizePixel = 0
	Corner2.Size = UDim2.new(0, 10, 0, 10)

	Divider_2.Name = "Divider"
	Divider_2.Parent = Buttons
	Divider_2.BackgroundColor3 = Color3.fromRGB(235, 235, 235)
	Divider_2.BorderSizePixel = 0
	Divider_2.Position = UDim2.new(0, 125, 0, 0)
	Divider_2.Size = UDim2.new(0, 1, 1, 0)

	Button2.Name = "Button2"
	Button2.Parent = Buttons
	Button2.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	Button2.BorderSizePixel = 0
	Button2.Position = UDim2.new(0, 126, 0, 0)
	Button2.Size = UDim2.new(0, 124, 1, 0)

	Disabled_2.Name = "Disabled"
	Disabled_2.Parent = Button2

	UICorner_4.Parent = Button2

	Text_2.Name = "Text"
	Text_2.Parent = Button2
	Text_2.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	Text_2.BackgroundTransparency = 1.000
	Text_2.BorderSizePixel = 0
	Text_2.Size = UDim2.new(1, 0, 1, 0)
	Text_2.Font = Enum.Font.Arial
	Text_2.Text = ""
	Text_2.TextColor3 = Color3.fromRGB(35, 140, 254)
	Text_2.TextSize = 15.000

	Corner2_2.Name = "Corner2"
	Corner2_2.Parent = Button2
	Corner2_2.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	Corner2_2.BorderSizePixel = 0
	Corner2_2.Position = UDim2.new(0, 114, 0, 0)
	Corner2_2.Size = UDim2.new(0, 10, 0, 10)

	Corner1_2.Name = "Corner1"
	Corner1_2.Parent = Button2
	Corner1_2.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	Corner1_2.BorderSizePixel = 0
	Corner1_2.Size = UDim2.new(0, 10, 1, 0)

	if Info then
		if Info.Title then
			Title.Text = Info.Title
		end

		if Info.Description then
			Description.Text = Info.Description
		end

		if Info.Button1 then
			if Info.Button1.Text then
				Button1.Text.Text = Info.Button1.Text
			end

			if Info.Button1.Disabled then
				Button1.Disabled.Value = true
			end

			if Info.Button1.Remove then
				Buttons.Visible = false
				Divider.Visible = false
			end

			if Info.Button1.Func and not Info.Button1.Disabled then
				local inputEndedConnection

				Button1.MouseEnter:Connect(function()
					inputEndedConnection = Button1.InputEnded:Connect(function(input)
						if input.UserInputType == Enum.UserInputType.MouseButton1 then
							Info.Button1.Func()
						end
					end)
				end)

				Button1.MouseLeave:Connect(function()
					if inputEndedConnection then
						inputEndedConnection:Disconnect()
					end
				end)
			end

			if Info.Button1.DestroyOnClick and not Info.Button1.Disabled then
				local inputEndedConnection

				Button1.MouseEnter:Connect(function()
					inputEndedConnection = Button1.InputEnded:Connect(function(input)
						if input.UserInputType == Enum.UserInputType.MouseButton1 then
							local tweenService = game:GetService("TweenService")
							local tweenSize = tweenService:Create(
								XAlert,
								TweenInfo.new(0.25, Enum.EasingStyle.Quint, Enum.EasingDirection.Out),
								{ Size = UDim2.new(0, 0, 0, 0) }
							)

							XAlert.AutomaticSize = Enum.AutomaticSize.None
							tweenSize:Play()
							tweenSize.Completed:Connect(function()
								XAlert:Destroy()
							end)
						end
					end)
				end)

				Button1.MouseLeave:Connect(function()
					if inputEndedConnection then
						inputEndedConnection:Disconnect()
					end
				end)
			end

			if Info.Button1.Color then
				Text.TextColor3 = Info.Button1.Color
			end
		end

		if Info.Button2 then
			if Info.Button2.Text then
				Button2.Text.Text = Info.Button2.Text
			end

			if Info.Button2.Disabled then
				Button2.Disabled.Value = true
			end

			if Info.Button2.Remove then
				Button2.Visible = false
				Divider_2.Visible = false
				Button1.Size = UDim2.new(1, 0, 1, 0)
				Button1.Corner1.Position = UDim2.new(0, 240, 0, 0)
				Button1.Corner1.Size = UDim2.new(0, 10, 0, 10)
			end

			if Info.Button2.Func and not Info.Button2.Disabled then
				local inputEndedConnection

				Button2.MouseEnter:Connect(function()
					inputEndedConnection = Button2.InputEnded:Connect(function(input)
						if input.UserInputType == Enum.UserInputType.MouseButton1 then
							Info.Button2.Func()
						end
					end)
				end)

				Button2.MouseLeave:Connect(function()
					if inputEndedConnection then
						inputEndedConnection:Disconnect()
					end
				end)
			end

			if Info.Button2.DestroyOnClick and not Info.Button2.Disabled then
				local inputEndedConnection

				Button2.MouseEnter:Connect(function()
					inputEndedConnection = Button2.InputEnded:Connect(function(input)
						if input.UserInputType == Enum.UserInputType.MouseButton1 then
							local tweenService = game:GetService("TweenService")
							local tweenSize = tweenService:Create(
								XAlert,
								TweenInfo.new(0.25, Enum.EasingStyle.Quint, Enum.EasingDirection.Out),
								{ Size = UDim2.new(0, 0, 0, 0) }
							)

							XAlert.AutomaticSize = Enum.AutomaticSize.None
							tweenSize:Play()
							tweenSize.Completed:Connect(function()
								XAlert:Destroy()
							end)
						end
					end)
				end)

				Button2.MouseLeave:Connect(function()
					if inputEndedConnection then
						inputEndedConnection:Disconnect()
					end
				end)
			end

			if Info.Button2.Color then
				Text_2.TextColor3 = Info.Button2.Color
			end
		end

		if Info.RemoveIn then
			coroutine.wrap(function()
				task.wait(Info.RemoveIn)

				local tweenService = game:GetService("TweenService")
				local tweenSize = tweenService:Create(
					XAlert,
					TweenInfo.new(0.25, Enum.EasingStyle.Quint, Enum.EasingDirection.Out),
					{ Size = UDim2.new(0, 0, 0, 0) }
				)

				XAlert.AutomaticSize = Enum.AutomaticSize.None
				tweenSize:Play()
				tweenSize.Completed:Connect(function()
					XAlert:Destroy()
				end)
			end)()
		end
	end

	XAlert.Visible = true

	CreateFakeScript(function() -- Button1.ButtonScript
		local script = Instance.new("LocalScript", Button1)

		local parent = script.Parent
		local colors = {
			mouseEnter = Color3.fromRGB(248, 248, 248),
			mouseExit = Color3.fromRGB(255, 255, 255),
			mouseDown = Color3.fromRGB(240, 240, 240),
		}
		local function setColor(color)
			parent.BackgroundColor3 = color
			parent.Corner1.BackgroundColor3 = color
			parent.Corner2.BackgroundColor3 = color
		end

		if parent.Disabled.Value then
			parent.BackgroundTransparency = 0.5
			parent.Text.TextTransparency = 0.5
			return
		end

		parent.MouseEnter:Connect(function()
			setColor(colors.mouseEnter)
		end)

		parent.MouseLeave:Connect(function()
			setColor(colors.mouseExit)
		end)

		parent.InputBegan:Connect(function(input)
			if input.UserInputType == Enum.UserInputType.MouseButton1 then
				setColor(colors.mouseDown)
			end
		end)

		parent.InputEnded:Connect(function(input)
			if input.UserInputType == Enum.UserInputType.MouseButton1 then
				setColor(colors.mouseEnter)
			end
		end)
	end)

	CreateFakeScript(function() -- Button2.ButtonScript
		local script = Instance.new("LocalScript", Button2)

		local parent = script.Parent
		local colors = {
			mouseEnter = Color3.fromRGB(248, 248, 248),
			mouseExit = Color3.fromRGB(255, 255, 255),
			mouseDown = Color3.fromRGB(240, 240, 240),
		}
		local function setColor(color)
			parent.BackgroundColor3 = color
			parent.Corner1.BackgroundColor3 = color
			parent.Corner2.BackgroundColor3 = color
		end

		if parent.Disabled.Value then
			parent.BackgroundTransparency = 0.5
			parent.Text.TextTransparency = 0.5
			return
		end

		parent.MouseEnter:Connect(function()
			setColor(colors.mouseEnter)
		end)

		parent.MouseLeave:Connect(function()
			setColor(colors.mouseExit)
		end)

		parent.InputBegan:Connect(function(input)
			if input.UserInputType == Enum.UserInputType.MouseButton1 then
				setColor(colors.mouseDown)
			end
		end)

		parent.InputEnded:Connect(function(input)
			if input.UserInputType == Enum.UserInputType.MouseButton1 then
				setColor(colors.mouseEnter)
			end
		end)
	end)

	CreateFakeScript(function() -- XAlert.DragScript
		local script = Instance.new("LocalScript", XAlert)

		local Players = game:GetService("Players")
		local Player = Players.LocalPlayer
		local UserInputService = game:GetService("UserInputService")
		local TweenService = game:GetService("TweenService")
		local Frame = script.Parent
		local function Drag()
			local Mouse = UserInputService:GetMouseLocation()
			TweenService:Create(Frame, TweenInfo.new(0.25, Enum.EasingStyle.Quint, Enum.EasingDirection.Out), {
				Position = UDim2.new(
					0,
					Mouse.X - Frame.AbsolutePosition.X / Frame.AbsoluteSize.X,
					0,
					Mouse.Y - Frame.AbsolutePosition.Y / Frame.AbsoluteSize.Y,
					0
				),
			}):Play()
		end

		local mouseConnection

		Frame.Title.InputBegan:Connect(function(input)
			if input.UserInputType == Enum.UserInputType.MouseButton1 then
				if mouseConnection then
					mouseConnection:Disconnect()
				end
				mouseConnection = Player:GetMouse().Move:Connect(Drag)
			end
		end)

		Frame.Title.InputEnded:Connect(function(input)
			if input.UserInputType == Enum.UserInputType.MouseButton1 then
				if mouseConnection then
					mouseConnection:Disconnect()
				end
			end
		end)
	end)

	CreateFakeScript(function() -- XAlert.TweenScript
		local script = Instance.new("LocalScript", XAlert)

		local parent = script.Parent
		local tweenService = game:GetService("TweenService")
		local originalGuiSize = parent.AbsoluteSize
		local tweenSize = tweenService:Create(
			parent,
			TweenInfo.new(0.25, Enum.EasingStyle.Quint, Enum.EasingDirection.Out),
			{ Size = UDim2.new(0, originalGuiSize.X, 0, originalGuiSize.Y) }
		)

		parent.AutomaticSize = Enum.AutomaticSize.None
		parent.Size = UDim2.new(0, 0, 0, 0)
		tweenSize:Play()
		tweenSize.Completed:Connect(function()
			parent.AutomaticSize = Enum.AutomaticSize.Y
		end)
	end)
end

XLib.CreateNotification = function(Info)
	local XNotification = Instance.new("Frame")
	local UICorner = Instance.new("UICorner")
	local UIPadding = Instance.new("UIPadding")
	local UIListLayout = Instance.new("UIListLayout")
	local Title = Instance.new("TextLabel")
	local Description = Instance.new("TextLabel")

	XNotification.Name = "XNotification"
	XNotification.Parent = XNotifications
	XNotification.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	XNotification.BorderSizePixel = 0
	XNotification.ClipsDescendants = true
	XNotification.Size = UDim2.new(0.25, 0, 0, 0)
	XNotification.Visible = false
	XNotification.AutomaticSize = Enum.AutomaticSize.Y

	UICorner.Parent = XNotification

	UIPadding.Parent = XNotification
	UIPadding.PaddingBottom = UDim.new(0, 10)
	UIPadding.PaddingLeft = UDim.new(0, 10)
	UIPadding.PaddingRight = UDim.new(0, 10)
	UIPadding.PaddingTop = UDim.new(0, 10)

	UIListLayout.Parent = XNotification
	UIListLayout.SortOrder = Enum.SortOrder.LayoutOrder
	UIListLayout.Padding = UDim.new(0, 5)
	UIListLayout.VerticalAlignment = Enum.VerticalAlignment.Bottom

	Title.Name = "Title"
	Title.Parent = XNotification
	Title.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	Title.BackgroundTransparency = 1.000
	Title.BorderSizePixel = 0
	Title.Size = UDim2.new(1, 0, 0, 0)
	Title.Font = Enum.Font.SourceSansBold
	Title.Text = ""
	Title.TextColor3 = Color3.fromRGB(45, 45, 45)
	Title.TextSize = 18.000
	Title.AutomaticSize = Enum.AutomaticSize.Y

	Description.Name = "Description"
	Description.Parent = XNotification
	Description.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	Description.BackgroundTransparency = 1.000
	Description.BorderSizePixel = 0
	Description.Size = UDim2.new(1, 0, 0, 0)
	Description.Font = Enum.Font.SourceSans
	Description.Text = ""
	Description.TextColor3 = Color3.fromRGB(45, 45, 45)
	Description.TextSize = 18.000
	Description.TextWrapped = true
	Description.AutomaticSize = Enum.AutomaticSize.Y

	if Info then
		if Info.Title then
			Title.Text = Info.Title
		end

		if Info.Description then
			Description.Text = Info.Description
		end

		coroutine.wrap(function()
			task.wait((Info.RemoveIn and Info.RemoveIn or 5))

			local tweenService = game:GetService("TweenService")
			local tweenSize = tweenService:Create(
				XNotification,
				TweenInfo.new(0.25, Enum.EasingStyle.Quint, Enum.EasingDirection.Out),
				{ Size = UDim2.new(0, 0, 0, 0) }
			)

			XNotification.AutomaticSize = Enum.AutomaticSize.None
			tweenSize:Play()
			tweenSize.Completed:Connect(function()
				XNotification:Destroy()
			end)
		end)()
	end

	XNotification.Visible = true

	CreateFakeScript(function() -- XNotification.TweenScript
		local script = Instance.new("LocalScript", XNotification)

		local parent = script.Parent
		local tweenService = game:GetService("TweenService")
		local originalGuiSize = parent.AbsoluteSize
		local tweenSize = tweenService:Create(
			parent,
			TweenInfo.new(0.25, Enum.EasingStyle.Quint, Enum.EasingDirection.Out),
			{ Size = UDim2.new(0, originalGuiSize.X, 0, originalGuiSize.Y) }
		)

		parent.AutomaticSize = Enum.AutomaticSize.None
		parent.Size = UDim2.new(0, 0, 0, 0)
		tweenSize:Play()
		tweenSize.Completed:Connect(function()
			parent.AutomaticSize = Enum.AutomaticSize.Y
		end)
	end)
end

XAlerts.Name = "XAlerts"
XAlerts.Parent = CoreGui
XAlerts.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
XAlerts.DisplayOrder = 9
XAlerts.ResetOnSpawn = false

XNotifications.Name = "XNotifications"
XNotifications.Parent = XAlerts
XNotifications.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
XNotifications.BackgroundTransparency = 1.000
XNotifications.BorderSizePixel = 0
XNotifications.ClipsDescendants = true
XNotifications.Size = UDim2.new(1, 0, 0, 265)

UIPadding.Parent = XNotifications
UIPadding.PaddingBottom = UDim.new(0, 10)
UIPadding.PaddingLeft = UDim.new(0, 10)
UIPadding.PaddingRight = UDim.new(0, 10)
UIPadding.PaddingTop = UDim.new(0, 10)

UIListLayout.Parent = XNotifications
UIListLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
UIListLayout.SortOrder = Enum.SortOrder.LayoutOrder
UIListLayout.Padding = UDim.new(0, 10)

return XLib
