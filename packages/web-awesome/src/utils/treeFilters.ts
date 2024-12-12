import type { DefaultTreeData } from "@allurereport/core-api";
import type { ReportContentContextValue } from "@/components/app/ReportBody/context";

const statusOrder = {
  failed: 1,
  broken: 2,
  passed: 3,
  skipped: 4,
  unknown: 5,
};

const filterByQuery = ({
  leaves,
  leavesById,
  query,
}: {
  leaves: string[];
  leavesById: DefaultTreeData["leavesById"];
  query: string;
}) =>
  leaves.filter((leafId) => {
    const lowerCaseQuery = query.toLocaleLowerCase();
    const foundById = leavesById[leafId].nodeId.toLowerCase().includes(lowerCaseQuery);
    const foundByName = leavesById[leafId].name.toLowerCase().includes(lowerCaseQuery);

    return foundById || foundByName;
  });

const sortedLeaves = ({
  leavesFiltered,
  leavesById,
  filterOptions,
}: {
  leavesFiltered: string[];
  leavesById: DefaultTreeData["leavesById"];
  filterOptions: ReportContentContextValue;
}) => {
  leavesFiltered.sort((a, b) => {
    const leafA = leavesById[a];
    const leafB = leavesById[b];
    const filterDirection = filterOptions.direction === "asc";

    switch (filterOptions.sortBy) {
      case "duration":
        return filterDirection
          ? (leafA.duration || 0) - (leafB.duration || 0)
          : (leafB.duration || 0) - (leafA.duration || 0);
      case "alphabet":
        return filterDirection ? leafA.name.localeCompare(leafB.name) : leafB.name.localeCompare(leafA.name);
      case "status": {
        const statusA = statusOrder[leafA.status] || statusOrder.unknown;
        const statusB = statusOrder[leafB.status] || statusOrder.unknown;
        return filterDirection ? statusA - statusB : statusB - statusA;
      }
      default:
        return 0;
    }
  });

  if (filterOptions.direction === "desc" && ["order"].includes(filterOptions.sortBy as string)) {
    leavesFiltered.reverse();
  }

  return leavesFiltered;
};

const filterByTestType = ({
  leaves,
  leavesById,
  filterTypes,
}: {
  leaves: string[];
  leavesById: DefaultTreeData["leavesById"];
  filterTypes: ReportContentContextValue["filter"];
}) => {
  return leaves.filter((leafId) => {
    const leaf = leavesById[leafId];
    return (!filterTypes.flaky || leaf.flaky) && (!filterTypes.retry || leaf.retry) && (!filterTypes.new || leaf.new);
  });
};

export const filterLeaves = (
  leaves: string[],
  leavesById: DefaultTreeData["leavesById"],
  statusFilter?: string,
  filterOptions?: ReportContentContextValue,
): string[] => {
  let leavesFiltered =
    statusFilter === "total" || !statusFilter
      ? filterByQuery({
          leaves,
          leavesById,
          query: filterOptions.query,
        })
      : leaves.filter((leafId) => leavesById[leafId].status === statusFilter);

  leavesFiltered = filterByQuery({
    leaves: leavesFiltered,
    leavesById,
    query: filterOptions.query,
  });

  leavesFiltered = filterByTestType({ leaves: leavesFiltered, leavesById, filterTypes: filterOptions.filter });

  leavesFiltered = sortedLeaves({ leavesFiltered, leavesById, filterOptions });

  return leavesFiltered;
};

export const filterGroups = (
  groups: string[],
  groupsById: DefaultTreeData["groupsById"],
  leavesById: DefaultTreeData["leavesById"],
  statusFilter?: string,
  filterOptions?: ReportContentContextValue,
): string[] => {
  const gro = groups.filter((groupId) => {
    const group = groupsById?.[groupId];
    const groupLeaves = filterLeaves((group?.leaves as string[]) || [], leavesById, statusFilter, filterOptions);
    const filteredSubGroups = group?.groups?.filter((subGroupId: number) => {
      const subGroup = groupsById?.[subGroupId] as { leaves: string[]; groups: string[] };
      return (
        filterLeaves(subGroup?.leaves || [], leavesById, statusFilter, filterOptions).length > 0 ||
        filterGroups(subGroup?.groups || [], groupsById, leavesById, statusFilter, filterOptions).length > 0
      );
    });

    return groupLeaves.length > 0 || (filteredSubGroups && filteredSubGroups.length > 0);
  });

  const sortedGroups = gro.sort((a, b) => {
    const leafA = groupsById[a];
    const leafB = groupsById[b];
    const filterDirection = filterOptions.direction === "asc";

    switch (filterOptions.sortBy) {
      case "alphabet": {
        return filterDirection ? leafA.name.localeCompare(leafB.name) : leafB.name.localeCompare(leafA.name);
      }
      default:
        return 0;
    }
  });

  if (filterOptions.direction === "desc" && ["order"].includes(filterOptions.sortBy as string)) {
    sortedGroups.reverse();
  }

  return sortedGroups;
};
