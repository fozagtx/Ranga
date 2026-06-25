declare module "connectkit-next-siwe" {
  import type { FunctionComponent, ComponentProps } from "react";
  import type { SIWEProvider } from "connectkit";
  import type { IncomingMessage, ServerResponse } from "node:http";
  import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
  import type { Chain, Transport } from "viem";

  type NextSIWESession<TSessionData extends object = object> = TSessionData & {
    nonce?: string;
    address?: string;
    chainId?: number;
    save?: () => Promise<void>;
    destroy?: () => void;
  };

  type NextServerSIWEConfig = {
    config?: {
      chains: readonly [Chain, ...Chain[]];
      transports?: Record<number, Transport>;
    };
    session?: {
      password?: string;
      cookieName?: string;
      cookieOptions?: {
        httpOnly?: boolean;
        sameSite?: "strict" | "lax" | "none";
        secure?: boolean;
      };
    };
    options?: Record<string, unknown>;
  };

  type NextClientSIWEConfig = {
    apiRoutePrefix: string;
    statement?: string;
  };

  type NextSIWEProviderProps = Omit<
    ComponentProps<typeof SIWEProvider>,
    "getNonce" | "createMessage" | "verifyMessage" | "getSession" | "signOut" | "data" | "signIn" | "status" | "resetStatus"
  >;

  export function configureServerSideSIWE<TSessionData extends object = object>(
    config: NextServerSIWEConfig,
  ): {
    apiRouteHandler: NextApiHandler;
    getSession: (req: IncomingMessage, res: ServerResponse) => Promise<NextSIWESession<TSessionData>>;
  };

  export function configureClientSIWE<TSessionData extends object = object>(
    config: NextClientSIWEConfig,
  ): {
    Provider: FunctionComponent<NextSIWEProviderProps>;
  };
}
