import { ErrorFallback } from "@/components/error-fallback";
import { TransactionsModal } from "@/components/modals/transactions-modal";
import { Table } from "@/components/tables/transactions";
import { Loading } from "@/components/tables/transactions/loading";
import { TransactionsActions } from "@/components/transactions-actions";
import { TransactionsSearchFilter } from "@/components/transactions-search-filter";
import { Cookies } from "@/utils/constants";
import {
  getCategories,
  getTeamBankAccounts,
  getTeamMembers,
} from "@midday/supabase/cached-queries";
import type { Metadata } from "next";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { VALID_FILTERS } from "./filters";
import { searchParamsCache } from "./search-params";

export const metadata: Metadata = {
  title: "Transactions | Midday",
};

export default async function Transactions({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const {
    q: query,
    page,
    attachments,
    start,
    end,
    categories,
    assignees,
    statuses,
  } = searchParamsCache.parse(searchParams);

  // Move this in a suspense
  const [accountsData, categoriesData, teamMembersData] = await Promise.all([
    getTeamBankAccounts(),
    getCategories(),
    getTeamMembers(),
  ]);

  const filter = {
    attachments,
    start,
    end,
    categories,
    assignees,
    statuses,
  };

  const sort = searchParams?.sort?.split(":");

  const hideConnectFlow = cookies().has(Cookies.HideConnectFlow);

  const isOpen = Boolean(searchParams.step);
  const isEmpty = !accountsData?.data?.length && !isOpen;
  const loadingKey = JSON.stringify({
    page,
    filter,
    sort,
    query,
  });

  return (
    <>
      <div className="flex justify-between py-6">
        <TransactionsSearchFilter
          placeholder="Search or type filter"
          validFilters={VALID_FILTERS}
          categories={categoriesData?.data?.map((category) => ({
            slug: category.slug,
            name: category.name,
          }))}
          accounts={accountsData?.data?.map((account) => ({
            id: account.id,
            name: account.name,
            currency: account.currency,
          }))}
          members={teamMembersData?.data?.map((member) => ({
            id: member?.user?.id,
            name: member.user?.full_name,
          }))}
        />
        <TransactionsActions isEmpty={isEmpty} />
      </div>

      <ErrorBoundary errorComponent={ErrorFallback}>
        <Suspense fallback={<Loading />} key={loadingKey}>
          <Table
            filter={filter}
            page={page}
            sort={sort}
            noAccounts={isEmpty}
            query={query}
          />
        </Suspense>
      </ErrorBoundary>

      <TransactionsModal defaultOpen={isEmpty && !hideConnectFlow} />
    </>
  );
}
