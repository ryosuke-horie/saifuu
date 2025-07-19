import type { Meta, StoryObj } from "@storybook/react";
import { Spinner } from "./Spinner";

const meta: Meta<typeof Spinner> = {
  title: "UI/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "統一されたローディングスピナーコンポーネント。サイズとカラーのバリエーションを提供します。",
      },
    },
  },
  argTypes: {
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
      description: "スピナーのサイズ",
    },
    color: {
      control: "radio", 
      options: ["primary", "secondary"],
      description: "スピナーの色",
    },
    className: {
      control: "text",
      description: "追加のCSSクラス",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: {
    size: "sm",
  },
};

export const Medium: Story = {
  args: {
    size: "md",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
  },
};

export const Primary: Story = {
  args: {
    color: "primary",
  },
};

export const Secondary: Story = {
  args: {
    color: "secondary",
  },
};

export const AllVariations: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">サイズバリエーション</h3>
        <div className="flex items-center space-x-8">
          <div className="text-center">
            <Spinner size="sm" />
            <p className="mt-2 text-sm text-gray-600">Small</p>
          </div>
          <div className="text-center">
            <Spinner size="md" />
            <p className="mt-2 text-sm text-gray-600">Medium</p>
          </div>
          <div className="text-center">
            <Spinner size="lg" />
            <p className="mt-2 text-sm text-gray-600">Large</p>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">カラーバリエーション</h3>
        <div className="flex items-center space-x-8">
          <div className="text-center">
            <Spinner color="primary" size="md" />
            <p className="mt-2 text-sm text-gray-600">Primary</p>
          </div>
          <div className="text-center">
            <Spinner color="secondary" size="md" />
            <p className="mt-2 text-sm text-gray-600">Secondary</p>
          </div>
        </div>
      </div>
    </div>
  ),
};