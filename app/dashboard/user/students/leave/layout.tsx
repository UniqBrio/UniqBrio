import type React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Student Leave Management - UniqBrio",
	description: "Analyze leave insights and review absence records for every student.",
};

export default function StudentLeaveLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
