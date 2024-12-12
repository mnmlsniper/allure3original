import type { TestStatus } from "@allurereport/core-api";
import { useTabsContext } from "@/components/app/Tabs";
import Tree from "@/components/app/Tree/Tree";
import { Loadable } from "@/components/commons/Loadable";
import { PageLoader } from "@/components/commons/PageLoader";
import { Text } from "@/components/commons/Typography";
import { useI18n } from "@/stores/locale";
import { treeStore } from "@/stores/tree";
import * as styles from "./styles.scss";

export const TreeList = () => {
  const { t } = useI18n("empty");
  const { currentTab } = useTabsContext();

  return (
    <Loadable
      source={treeStore}
      renderLoader={() => <PageLoader />}
      renderData={(treeData) => {
        const { groups, leaves } = treeData?.root ?? {};

        if (!groups && !leaves) {
          return (
            <div className={styles["tree-list"]}>
              <div className={styles["tree-empty-results"]}>
                <Text className={styles["tree-empty-results-title"]}>{t("no-results")}</Text>
              </div>
            </div>
          );
        }

        return (
          <div className={styles["tree-list"]}>
            <Tree groups={groups} leaves={leaves} statusFilter={currentTab as TestStatus} root />
          </div>
        );
      }}
    />
  );
};
