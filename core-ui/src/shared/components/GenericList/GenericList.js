import React, { useState, useEffect } from 'react';
import { LayoutPanel } from 'fundamental-react';
import { useTranslation } from 'react-i18next';

import { SearchInput } from 'shared/components/GenericList/SearchInput';
import { Pagination } from 'shared/components/GenericList/Pagination/Pagination';
import ListActions from 'shared/components/ListActions/ListActions';
import { Spinner } from 'shared/components/Spinner/Spinner';
import {
  HeaderRenderer,
  RowRenderer,
  BodyFallback,
} from 'shared/components/GenericList/components';

import { filterEntries } from 'shared/components/GenericList/helpers';
import classnames from 'classnames';

import PropTypes from 'prop-types';
import CustomPropTypes from 'shared/typechecking/CustomPropTypes';

import { useMicrofrontendContext } from 'shared/contexts/MicrofrontendContext';
import { getErrorMessage } from 'shared/utils/helpers';
import { nameLocaleSort, timeSort } from 'shared/helpers/sortingfunctions';
import { SortModalPanel } from './SortModalPanel';
import { isEmpty } from 'lodash';
import './GenericList.scss';

const defaultSort = {
  name: nameLocaleSort,
  time: timeSort,
};

const defaultSearch = {
  showSearchField: true,
  textSearchProperties: ['name', 'description'],
  showSearchControl: true,
  showSearchSuggestion: true,
  allowSlashShortcut: true,
  noSearchResultMessage: 'components.generic-list.messages.no-search-results',
};

export const GenericList = ({
  entries,
  actions,
  extraHeaderContent,
  title,
  headerRenderer,
  rowRenderer,
  testid,
  showHeader,
  serverDataError,
  serverDataLoading,
  pagination,
  compact,
  className,
  currentlyEditedResourceUID,
  sortBy,
  notFoundMessage,
  searchSettings,
}) => {
  searchSettings = { ...defaultSearch, ...searchSettings };

  if (typeof sortBy === 'function') sortBy = sortBy(defaultSort);

  const [sort, setSort] = useState({
    name: sortBy && Object.keys(sortBy)[0],
    order: 'ASC',
  });

  const sorting = (sort, resources) => {
    if (!sortBy || isEmpty(sortBy)) return resources;

    const sortFunction = Object.entries(sortBy).filter(([name]) => {
      return name === sort.name;
    })[0][1];
    if (sort.order === 'ASC') {
      return [...resources.sort(sortFunction)];
    } else {
      return [...resources.sort((a, b) => sortFunction(b, a))];
    }
  };

  const { settings } = useMicrofrontendContext();
  if (pagination) {
    pagination.itemsPerPage =
      pagination.itemsPerPage || settings?.pagination?.pageSize;
  }

  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = React.useState(
    pagination?.initialPage || 1,
  );
  const [filteredEntries, setFilteredEntries] = useState(() =>
    sorting(sort, entries),
  );
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (pagination) {
      // move back when the last item from the last page is deleted
      const pagesCount = Math.ceil(entries.length / pagination.itemsPerPage);
      if (currentPage > pagesCount && pagesCount > 0) {
        setCurrentPage(pagesCount);
      }
    }
    setFilteredEntries(
      filterEntries(
        sorting(sort, entries),
        searchQuery,
        searchSettings?.textSearchProperties,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchQuery,
    setFilteredEntries,
    entries,
    pagination?.itemsPerPage,
    sort,
  ]);

  React.useEffect(() => setCurrentPage(1), [searchQuery]);

  const headerActions = (
    <>
      {searchSettings?.showSearchField && (
        <SearchInput
          entriesKind={title || ''}
          searchQuery={searchQuery}
          filteredEntries={filteredEntries}
          handleQueryChange={setSearchQuery}
          suggestionProperties={searchSettings?.textSearchProperties}
          showSuggestion={searchSettings?.showSearchSuggestion}
          showSearchControl={searchSettings?.showSearchControl}
          allowSlashShortcut={searchSettings?.allowSlashShortcut}
          disabled={!entries.length}
        />
      )}
      {sortBy && !isEmpty(sortBy) && (
        <SortModalPanel
          sortBy={sortBy}
          sort={sort}
          setSort={setSort}
          disabled={!entries.length}
        />
      )}
      {extraHeaderContent}
    </>
  );

  const renderTableBody = () => {
    if (serverDataError) {
      return (
        <BodyFallback>
          <p>{getErrorMessage(serverDataError)}</p>
        </BodyFallback>
      );
    }

    if (serverDataLoading) {
      return (
        <BodyFallback>
          <Spinner />
        </BodyFallback>
      );
    }
    if (!filteredEntries.length) {
      if (searchQuery) {
        return (
          <BodyFallback>
            <p>
              {t(searchSettings.noSearchResultMessage) ||
                searchSettings.noSearchResultMessage}
            </p>
          </BodyFallback>
        );
      }
      return (
        <BodyFallback>
          <p>{t(notFoundMessage) || notFoundMessage}</p>
        </BodyFallback>
      );
    }

    let pagedItems = filteredEntries;
    if (pagination) {
      pagedItems = filteredEntries.slice(
        (currentPage - 1) * pagination.itemsPerPage,
        currentPage * pagination.itemsPerPage,
      );
    }

    return pagedItems.map((e, index) => (
      <RowRenderer
        index={index}
        key={e.metadata?.uid || e.name || e.metadata?.name || index}
        entry={e}
        actions={actions}
        rowRenderer={rowRenderer}
        compact={compact}
        isBeingEdited={
          currentlyEditedResourceUID &&
          e?.metadata?.uid === currentlyEditedResourceUID
        }
      />
    ));
  };

  const tableClassNames = classnames(
    'fd-table',
    'fd-table--no-horizontal-borders',
    { compact },
  );
  const panelClassNames = classnames(
    'generic-list',
    {
      'fd-margin--md': !className?.includes('fd-margin'),
    },
    className,
  );

  return (
    <LayoutPanel className={panelClassNames} data-testid={testid}>
      <LayoutPanel.Header className="fd-has-padding-left-small fd-has-padding-right-small">
        <LayoutPanel.Head title={title} />
        <LayoutPanel.Actions>{headerActions}</LayoutPanel.Actions>
      </LayoutPanel.Header>

      <LayoutPanel.Body className="fd-has-padding-none">
        <table className={tableClassNames}>
          {showHeader && (
            <thead className="fd-table__header">
              <tr className="fd-table__row">
                <HeaderRenderer
                  entries={entries}
                  actions={actions}
                  headerRenderer={headerRenderer}
                />
              </tr>
            </thead>
          )}
          <tbody className="fd-table__body">{renderTableBody()}</tbody>
        </table>
      </LayoutPanel.Body>
      {!!pagination &&
        (!pagination.autoHide ||
          filteredEntries.length > pagination.itemsPerPage) && (
          <LayoutPanel.Footer>
            <Pagination
              itemsTotal={filteredEntries.length}
              currentPage={currentPage}
              itemsPerPage={pagination.itemsPerPage}
              onChangePage={setCurrentPage}
            />
          </LayoutPanel.Footer>
        )}
    </LayoutPanel>
  );
};

GenericList.Actions = ListActions;

const PaginationProps = PropTypes.shape({
  itemsPerPage: PropTypes.number,
  initialPage: PropTypes.number,
  autoHide: PropTypes.bool,
});

const SearchProps = PropTypes.shape({
  showSearchField: PropTypes.bool,
  textSearchProperties: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string.isRequired,
      PropTypes.func.isRequired,
    ]),
  ),
  showSearchSuggestion: PropTypes.bool,
  showSearchControl: PropTypes.bool,
  allowSlashShortcut: PropTypes.bool,
  noSearchResultMessage: PropTypes.string,
});

GenericList.propTypes = {
  title: PropTypes.string,
  entries: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  ).isRequired,
  headerRenderer: PropTypes.func.isRequired,
  rowRenderer: PropTypes.func.isRequired,
  actions: CustomPropTypes.listActions,
  extraHeaderContent: PropTypes.node,
  testid: PropTypes.string,
  showHeader: PropTypes.bool,
  serverDataError: PropTypes.any,
  serverDataLoading: PropTypes.bool,
  pagination: PaginationProps,
  compact: PropTypes.bool,
  className: PropTypes.string,
  currentlyEditedResourceUID: PropTypes.string,
  sortBy: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  notFoundMessage: PropTypes.string,
  searchSettings: SearchProps,
};

GenericList.defaultProps = {
  entries: [],
  actions: [],
  showHeader: true,
  serverDataError: null,
  serverDataLoading: false,
  compact: true,
  notFoundMessage: 'components.generic-list.messages.not-found',
  searchSettings: defaultSearch,
};
