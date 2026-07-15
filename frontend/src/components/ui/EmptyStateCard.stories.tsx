import type { Meta, StoryObj } from "@storybook/react-vite";
import { Award, Calendar, TrendingUp } from "lucide-react";
import { EmptyStateCard } from "./EmptyStateCard";
import { ProductButton } from "./ProductButton";

const meta = {
  title: "UI/EmptyStateCard",
  component: EmptyStateCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof EmptyStateCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoWorkoutsRecorded: Story = {
  args: {
    icon: <Calendar className="size-8 text-muted-foreground" />,
    title: "No workouts recorded yet",
    description:
      "Workouts you finish will be listed here, grouped by calendar month.",
    action: <ProductButton fullWidth>Log First Workout</ProductButton>,
    className: "w-[22rem] p-12",
  },
};

export const NoPrWorkouts: Story = {
  args: {
    icon: <Award className="size-8 text-muted-foreground" />,
    title: "No PR workouts yet",
    description: "Keep lifting - your first PR will show up here.",
    className: "w-[22rem]",
  },
};

export const NoPerformanceData: Story = {
  args: {
    icon: <TrendingUp className="size-8 text-muted-foreground" />,
    title: "No performance data yet",
    description:
      "Once you complete workouts featuring this exercise, your progress charts will appear here.",
    className: "w-[22rem] bg-card/50 p-12",
  },
};
