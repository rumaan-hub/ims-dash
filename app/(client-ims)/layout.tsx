import React from "react";
import Sidebar from "../components/Sidebar";
import { SidebarProvider } from "../components/SidebarProvider";
import PageWrapper from "../components/PageWrapper";
import RouteGuard from "./RouteGuard";
import SessionTimeoutProvider from "../components/SessionTimeoutProvider";

export default function ClientImsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <SessionTimeoutProvider>
                {/* SIDEBAR COMPONENT */}
                <Sidebar />

                {/* MAIN CONTENT (Pages) */}
                <main id="mainContent" className="main-content">
                    <PageWrapper>
                        <RouteGuard>
                            {children}
                        </RouteGuard>
                    </PageWrapper>
                </main>
            </SessionTimeoutProvider>
        </SidebarProvider>
    );
}
