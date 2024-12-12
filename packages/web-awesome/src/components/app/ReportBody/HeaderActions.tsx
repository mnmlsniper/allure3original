import { useI18n } from "@/stores/locale";
import { SearchBox } from "../../commons/SearchBox";
import { Filters } from "./Filters";
import { useReportContentContext } from "./context";
import * as styles from "./styles.scss";

const Search = () => {
  const { setQuery, query } = useReportContentContext();
  const { t } = useI18n("search");

  return <SearchBox placeholder={t("search-placeholder")} value={query} onChange={setQuery} />;
};

export const HeaderActions = () => {
  return (
    <div className={styles.headerActions}>
      <Search />
      <Filters />
    </div>
  );
};
