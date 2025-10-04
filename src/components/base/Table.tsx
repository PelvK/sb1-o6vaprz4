import { ReactNode } from 'react';
import './Table.css';

interface TableProps {
  children: ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: ReactNode;
}

interface TableBodyProps {
  children: ReactNode;
}

interface TableRowProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
}

export const Table = ({ children, className = '' }: TableProps) => {
  return (
    <div className="table-container">
      <table className={`table ${className}`}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader = ({ children }: TableHeaderProps) => {
  return <thead className="table-header">{children}</thead>;
};

export const TableBody = ({ children }: TableBodyProps) => {
  return <tbody className="table-body">{children}</tbody>;
};

export const TableRow = ({ children, onClick, className = '' }: TableRowProps) => {
  return (
    <tr
      className={`table-row ${onClick ? 'table-row-clickable' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

export const TableCell = ({ children, className = '' }: TableCellProps) => {
  return <td className={`table-cell ${className}`}>{children}</td>;
};

export const TableHeadCell = ({ children, className = '' }: TableCellProps) => {
  return <th className={`table-head-cell ${className}`}>{children}</th>;
};
