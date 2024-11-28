"use client";

import { SessionProvider } from "next-auth/react";
import { IntlProvider } from "next-intl";

export default function ClientProviders({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SessionProvider>
            <IntlProvider locale="en">{children}</IntlProvider>
        </SessionProvider>
    );
}
