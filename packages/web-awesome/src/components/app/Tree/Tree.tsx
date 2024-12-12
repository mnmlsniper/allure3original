import type { Statistic, TestStatus, WithChildren } from "@allure/core-api";
import cx from "clsx";
import type { FunctionComponent } from "preact";
import { useState } from "preact/hooks";
import { useReportContentContext } from "@/components/app/ReportBody/context";
import TreeItem from "@/components/app/Tree/TreeItem";
import { Loadable } from "@/components/commons/Loadable";
import { PageLoader } from "@/components/commons/PageLoader";
import { Text } from "@/components/commons/Typography";
import { useI18n } from "@/stores";
import { treeStore } from "@/stores/tree";
import { filterGroups, filterLeaves } from "@/utils/treeFilters";
import TreeHeader from "./TreeHeader";
import * as styles from "./styles.scss";

interface TreeProps {
  statistic?: Statistic;
  leaves?: WithChildren["leaves"];
  groups?: WithChildren["groups"];
  name?: string;
  root?: boolean;
  statusFilter?: TestStatus;
}

const Tree: FunctionComponent<TreeProps> = ({ statusFilter, root, name, leaves = [], groups = [], statistic }) => {
  const [isOpened, setIsOpen] = useState(statistic === undefined || !!statistic.failed || !!statistic.broken);
  const { t } = useI18n("empty");

  return (
    <Loadable
      source={treeStore}
      renderLoader={() => <PageLoader />}
      renderData={(treeData) => {
        const reportContext = useReportContentContext();
        const toggleTree = () => {
          setIsOpen(!isOpened);
        };
        const leavesToRender = filterLeaves(leaves, treeData?.leavesById, statusFilter, reportContext);
        const groupsToRender = filterGroups(
          groups,
          treeData?.groupsById,
          treeData?.leavesById,
          statusFilter,
          reportContext,
        );
        if (!groupsToRender.length && !leavesToRender.length) {
          return (
            <div className={styles["tree-list"]}>
              <div className={styles["tree-empty-results"]}>
                <Text className={styles["tree-empty-results-title"]}>{t("no-results")}</Text>
              </div>
            </div>
          );
        }

        const treeContent = isOpened && (
          <div
            className={cx({
              [styles["tree-content"]]: true,
              [styles.root]: root,
            })}
          >
            {groupsToRender.map((groupId) => {
              const group = treeData?.groupsById?.[groupId];

              if (!group) {
                return null;
              }

              return (
                <Tree
                  key={group.nodeId}
                  name={group.name}
                  leaves={group.leaves}
                  groups={group.groups}
                  statistic={group.statistic}
                  statusFilter={statusFilter}
                />
              );
            })}
            {leavesToRender.map((leafId) => {
              const leaf = treeData?.leavesById?.[leafId];

              if (!leaf) {
                return null;
              }

              return (
                <TreeItem
                  data-testid="tree-leaf"
                  key={leaf.nodeId}
                  id={leaf.nodeId}
                  name={leaf.name}
                  status={leaf.status}
                  duration={leaf.duration}
                />
              );
            })}
          </div>
        );

        return (
          <div className={styles.tree}>
            {name && (
              <TreeHeader
                categoryTitle={name}
                isOpened={isOpened}
                toggleTree={toggleTree}
                statusFilter={statusFilter}
                statistic={statistic}
                data-testid="tree-group-header"
              />
            )}
            {treeContent}
          </div>
        );
      }}
    />
  );
};

export default Tree;
