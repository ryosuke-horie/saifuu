import type { Meta, StoryObj } from "@storybook/react";
import { LoadingState } from "./LoadingState";

const meta: Meta<typeof LoadingState> = {
  title: "UI/LoadingState",
  component: LoadingState,
  parameters: {
    docs: {
      description: {
        component: "統一されたローディング状態表示コンポーネント。様々なレイアウトパターンを提供します。",
      },
    },
  },
  argTypes: {
    message: {
      control: "text",
      description: "表示するメッセージ",
    },
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
      description: "スピナーのサイズ",
    },
    layout: {
      control: "radio",
      options: ["inline", "block", "fullpage"],
      description: "レイアウトパターン",
    },
    testId: {
      control: "text",
      description: "テスト用のdata-testid属性",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Inline: Story = {
  args: {
    layout: "inline",
  },
  decorators: [
    (Story) => (
      <div className="bg-gray-100 p-4 rounded">
        <span className="mr-2">何かのテキスト</span>
        <Story />
      </div>
    ),
  ],
};

export const Block: Story = {
  args: {
    layout: "block",
  },
  decorators: [
    (Story) => (
      <div className="bg-gray-100 p-4 rounded h-64">
        <Story />
      </div>
    ),
  ],
};

export const FullPage: Story = {
  args: {
    layout: "fullpage",
  },
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="relative h-96">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">ページコンテンツ</h1>
          <p>このコンテンツの上にローディングが表示されます。</p>
        </div>
        <Story />
      </div>
    ),
  ],
};

export const CustomMessage: Story = {
  args: {
    message: "データを取得しています...",
  },
};

export const LargeSize: Story = {
  args: {
    size: "lg",
    message: "処理中です...",
  },
};

export const InButton: Story = {
  render: () => (
    <button
      type="button" 
      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
      disabled
    >
      <LoadingState layout="inline" size="sm" message="送信中..." />
    </button>
  ),
};

export const InTable: Story = {
  render: () => (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            項目
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            金額
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        <tr>
          <td colSpan={2} className="px-4 py-8">
            <LoadingState />
          </td>
        </tr>
      </tbody>
    </table>
  ),
};