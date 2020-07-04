﻿import { VirtualComponent } from "../../components/virtualComponent";
import { FileViewModel } from "./fileViewModel";
import { Collapse } from "../../components/collapse";
import { Table, DateTimeColumn, MultiSelectColumn, ColumnTemplate } from "../../components/table";
import { Utils } from "../../ts/utils";
import { FileMetaData } from "./serversTypes";
import { Box } from "../../utils/box";
import { IObservableProperty } from "../../utils/observableProperty";
import { ComparatorHelper } from "../../utils/comparatorHelper";

class FileNameColumn extends ColumnTemplate<FileMetaData>{
    constructor(serverId: IObservableProperty<string>) {
        super();

        this.property = 'Name';

        this.cell = (name: string, box: Box<FileMetaData>) => {
            let file = box.value;

            let link = document.createElement('a') as HTMLAnchorElement;
            link.innerText = file.Name;
            link.href = `/admin/servers?handler=file&serverId=${serverId.value}&directory=${file.Directory}&name=${file.Name}`;
            link.onclick = event => event.stopPropagation();

            return link;
        }

        this.comparator = ComparatorHelper.buildStringComparatorForProperty(this.property);
    }
}

export class FileView extends VirtualComponent {
    constructor(fileViewModel: FileViewModel) {
        super();

        let table = new Table(fileViewModel.files,
            [
                new MultiSelectColumn(),
                new FileNameColumn(fileViewModel.serverId),
                new DateTimeColumn('LastModifiedTime').setHeader(() => 'Last Modified Time'),
                { property: 'Size', cell: (value) => Utils.bytesToSize(value) }
            ]);
        table.style.fontSize = '1rem';
        table.style.fontWeight = 'normal';
        table.style.lineHeight = '1.5';
        table.style.width = 'calc(100% - 2rem)';
        table.style.margin = '0rem 1rem 0.67rem 1rem';

        let collapse = new Collapse(fileViewModel.header, table);
        fileViewModel.propertyChanged('header', text => collapse.setHeader(text));
        collapse.open = true;
        collapse.classList.add('is-4', 'border', 'header');
        this._root = collapse;
    }
}