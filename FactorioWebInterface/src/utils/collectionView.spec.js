import { ObservableKeyArray } from "./observableCollection";
import { CollectionView, CollectionViewChangeType } from "./collectionView";
import { strict } from "assert";
import { CollectionChangeType } from "../ts/utils";
describe('CollectionView', function () {
    describe('values', function () {
        it('should be empty when created from empty collection.', function () {
            // Arrange.
            let o = new ObservableKeyArray(x => x);
            let cv = new CollectionView(o);
            // Act.
            let array = [...cv.values];
            // Assert.
            strict.equal(array.length, 0);
        });
    });
    describe('selected', function () {
        it('should be empty when created.', function () {
            // Arrange.
            let o = new ObservableKeyArray(x => x);
            let cv = new CollectionView(o);
            // Act.
            let selected = [...cv.selected];
            let viewabledSelected = [...cv.viewableSelected];
            // Assert.
            strict.equal(selected.length, 0);
            strict.equal(viewabledSelected.length, 0);
            strict.equal(cv.selectedCount, 0);
        });
        it('should contain item when item is selected.', function () {
            // Arrange.
            let o = new ObservableKeyArray(x => x);
            o.add(1, 2, 3);
            let cv = new CollectionView(o);
            let one = cv.getBoxByKey(1);
            let actualEvent;
            cv.selectedChanged.subscribe(event => actualEvent = event);
            // Act.            
            cv.setSelected(one, true);
            // Assert.
            let selected = [...cv.selected];
            let viewabledSelected = [...cv.viewableSelected];
            strict.equal(selected.length, 1);
            strict.equal(viewabledSelected.length, 1);
            strict.equal(cv.selectedCount, 1);
            strict.equal(selected[0], one);
            strict.equal(viewabledSelected[0], one);
            strict.equal(cv.isSelected(one), true);
            strict.equal(actualEvent.type, CollectionViewChangeType.Add);
            strict.deepEqual(actualEvent.items, [one]);
        });
        it('should contain items when items are selected.', function () {
            // Arrange.
            let o = new ObservableKeyArray(x => x);
            o.add(1, 2, 3);
            let cv = new CollectionView(o);
            let one = cv.getBoxByKey(1);
            let two = cv.getBoxByKey(2);
            let actualEvent;
            cv.selectedChanged.subscribe(event => actualEvent = event);
            // Act.            
            cv.setSelected(one, true);
            // Assert Event.
            strict.equal(actualEvent.type, CollectionViewChangeType.Add);
            strict.deepEqual(actualEvent.items, [one]);
            // Act.
            cv.setSelected(two, true);
            // Assert.
            strict.equal(actualEvent.type, CollectionViewChangeType.Add);
            strict.deepEqual(actualEvent.items, [two]);
            let expectedSelected = [one, two];
            strict.deepEqual([...cv.selected], expectedSelected);
            strict.deepEqual([...cv.viewableSelected], expectedSelected);
            strict.equal(cv.selectedCount, 2);
            strict.equal(cv.isSelected(one), true);
            strict.equal(cv.isSelected(two), true);
        });
        it('select all should select all items.', function () {
            // Arrange.
            let o = new ObservableKeyArray(x => x);
            o.add(1, 2, 3);
            let cv = new CollectionView(o);
            let actualEvent;
            cv.selectedChanged.subscribe(event => actualEvent = event);
            // Act.
            let one = cv.getBoxByKey(1);
            let two = cv.getBoxByKey(2);
            let three = cv.getBoxByKey(3);
            cv.selectAll();
            // Assert.
            let expectedSelected = [one, two, three];
            strict.deepEqual([...cv.selected], expectedSelected);
            strict.deepEqual([...cv.viewableSelected], expectedSelected);
            strict.equal(cv.selectedCount, 3);
            strict.equal(cv.isSelected(one), true);
            strict.equal(cv.isSelected(two), true);
            strict.equal(cv.isSelected(three), true);
            strict.equal(actualEvent.type, CollectionViewChangeType.Add);
            strict.deepEqual(actualEvent.items, expectedSelected);
        });
        it('unselecting an item removes it from selected items.', function () {
            // Arrange.
            let o = new ObservableKeyArray(x => x);
            o.add(1, 2, 3);
            let cv = new CollectionView(o);
            let one = cv.getBoxByKey(1);
            cv.setSelected(one, true);
            strict.equal(cv.isSelected(one), true);
            let actualEvent;
            cv.selectedChanged.subscribe(event => actualEvent = event);
            // Act.            
            cv.setSelected(one, false);
            // Assert.
            let expectedSelected = [];
            strict.deepEqual([...cv.selected], expectedSelected);
            strict.deepEqual([...cv.viewableSelected], expectedSelected);
            strict.equal(cv.selectedCount, 0);
            strict.equal(cv.isSelected(one), false);
            strict.equal(actualEvent.type, CollectionViewChangeType.Remove);
            strict.deepEqual(actualEvent.items, [one]);
        });
        it('removing an item removes it from selected items.', function () {
            // Arrange.
            let o = new ObservableKeyArray(x => x);
            o.add(1, 2, 3);
            let cv = new CollectionView(o);
            let one = cv.getBoxByKey(1);
            cv.setSelected(one, true);
            strict.equal(cv.isSelected(one), true);
            let actualEvent;
            cv.selectedChanged.subscribe(event => actualEvent = event);
            // Act.            
            o.remove(1);
            // Assert.
            let expectedSelected = [];
            strict.deepEqual([...cv.selected], expectedSelected);
            strict.deepEqual([...cv.viewableSelected], expectedSelected);
            strict.equal(cv.selectedCount, 0);
            strict.equal(cv.isSelected(one), false);
            strict.equal(actualEvent.type, CollectionViewChangeType.Remove);
            strict.deepEqual(actualEvent.items, [one]);
        });
        it('removing multiple items removes them from selected items.', function () {
            // Arrange.
            let o = new ObservableKeyArray(x => x);
            o.add(1, 2, 3);
            let cv = new CollectionView(o);
            let one = cv.getBoxByKey(1);
            let two = cv.getBoxByKey(2);
            cv.setSelected(one, true);
            cv.setSelected(two, true);
            strict.equal(cv.isSelected(one), true);
            strict.equal(cv.isSelected(two), true);
            let actualEvent;
            cv.selectedChanged.subscribe(event => actualEvent = event);
            // Act.            
            o.remove(1, 2);
            // Assert.
            let expectedSelected = [];
            strict.deepEqual([...cv.selected], expectedSelected);
            strict.deepEqual([...cv.viewableSelected], expectedSelected);
            strict.equal(cv.selectedCount, 0);
            strict.equal(cv.isSelected(one), false);
            strict.equal(cv.isSelected(two), false);
            strict.equal(actualEvent.type, CollectionViewChangeType.Remove);
            strict.deepEqual(actualEvent.items, [one, two]);
        });
        let resetEventTests = [
            { name: 'without new items', arg: { Type: CollectionChangeType.Reset } },
            { name: 'with new items', arg: { Type: CollectionChangeType.Reset, NewItems: [1, 2, 3] } }
        ];
        for (let test of resetEventTests) {
            it(`reset event ${test.name} removes selected items.`, function () {
                // Arrange.
                let o = new ObservableKeyArray(x => x);
                o.add(1, 2, 3);
                let cv = new CollectionView(o);
                let one = cv.getBoxByKey(1);
                cv.setSelected(one, true);
                strict.equal(cv.isSelected(one), true);
                let actualEvent;
                cv.selectedChanged.subscribe(event => actualEvent = event);
                // Act.            
                o.update(test.arg);
                // Assert.
                let expectedSelected = [];
                strict.deepEqual([...cv.selected], expectedSelected);
                strict.deepEqual([...cv.viewableSelected], expectedSelected);
                strict.equal(cv.selectedCount, 0);
                strict.equal(cv.isSelected(one), false);
                strict.equal(actualEvent.type, CollectionViewChangeType.Reset);
                strict.deepEqual(actualEvent.items, []);
            });
            it(`reset event ${test.name} when no items selected does not raise selected changed.`, function () {
                // Arrange.
                let o = new ObservableKeyArray(x => x);
                let cv = new CollectionView(o);
                o.add(1, 2, 3);
                let one = cv.getBoxByKey(1);
                let two = cv.getBoxByKey(2);
                let three = cv.getBoxByKey(3);
                let callbackFiredCount = 0;
                cv.selectedChanged.subscribe(() => callbackFiredCount++);
                strict.equal(cv.isSelected(one), false);
                strict.equal(cv.isSelected(two), false);
                strict.equal(cv.isSelected(three), false);
                // Act.
                o.update(test.arg);
                // Assert.
                strict.equal(callbackFiredCount, 0);
            });
            it(`reset event ${test.name} when items selected does raise selected changed.`, function () {
                // Arrange.
                let o = new ObservableKeyArray(x => x);
                let cv = new CollectionView(o);
                o.add(1, 2, 3);
                let one = cv.getBoxByKey(1);
                let two = cv.getBoxByKey(2);
                let three = cv.getBoxByKey(3);
                cv.selectAll();
                let actualEvent;
                cv.selectedChanged.subscribe(event => actualEvent = event);
                strict.equal(cv.isSelected(one), true);
                strict.equal(cv.isSelected(two), true);
                strict.equal(cv.isSelected(three), true);
                // Act.
                o.update(test.arg);
                // Assert.                
                strict.deepEqual([...cv.selected], []);
                strict.deepEqual([...cv.viewableSelected], []);
                strict.equal(cv.selectedCount, 0);
                strict.equal(actualEvent.type, CollectionViewChangeType.Reset);
                strict.deepEqual(actualEvent.items, []);
            });
        }
        it('adding item does not raise selected changed.', function () {
            // Arrange.
            let o = new ObservableKeyArray(x => x);
            let cv = new CollectionView(o);
            let callbackFiredCount = 0;
            cv.selectedChanged.subscribe(() => callbackFiredCount++);
            // Act add one item.
            o.add(1);
            // Assert.
            strict.equal(callbackFiredCount, 0);
            // Act add two items.
            o.add(2, 3);
            // Assert.
            strict.equal(callbackFiredCount, 0);
        });
        it('removing unselected item does not raise selected changed.', function () {
            // Arrange.
            let o = new ObservableKeyArray(x => x);
            let cv = new CollectionView(o);
            o.add(1, 2, 3);
            let one = cv.getBoxByKey(1);
            let two = cv.getBoxByKey(2);
            let three = cv.getBoxByKey(3);
            let callbackFiredCount = 0;
            cv.selectedChanged.subscribe(() => callbackFiredCount++);
            strict.equal(cv.isSelected(one), false);
            strict.equal(cv.isSelected(two), false);
            strict.equal(cv.isSelected(three), false);
            // Act remove one item.
            o.remove(2);
            // Assert.
            strict.equal(callbackFiredCount, 0);
            // Act remove two items.
            o.remove(1, 3);
            // Assert.
            strict.equal(callbackFiredCount, 0);
        });
    });
    describe('ObservableCollection change event', function () {
        it('when add items are added.', function () {
            // Arrange.
            let o = new ObservableKeyArray(x => x);
            let cv = new CollectionView(o);
            let callbackFiredCount = 0;
            cv.subscribe(() => callbackFiredCount++);
            // Add one item.
            o.add(1);
            let one = cv.getBoxByKey(1);
            strict.deepEqual([...cv.values], [one]);
            strict.equal(callbackFiredCount, 1);
            // Add two items.
            o.add(2, 3);
            let two = cv.getBoxByKey(2);
            let three = cv.getBoxByKey(3);
            strict.deepEqual([...cv.values], [one, two, three]);
            strict.equal(callbackFiredCount, 2);
        });
        it('when add and collectionView is sorted, reorder is raised.', function () {
            // Arrange.
            let o = new ObservableKeyArray(x => x);
            let cv = new CollectionView(o);
            cv.sortBy({ ascendingComparator: (a, b) => a - b });
            let raisedEvents = [];
            cv.subscribe((event) => raisedEvents.push(event.type));
            // Act.
            o.add(3, 1);
            // Assert.
            let one = cv.getBoxByKey(1);
            let three = cv.getBoxByKey(3);
            strict.deepEqual([...cv.values], [one, three]);
            strict.deepEqual(raisedEvents, [CollectionViewChangeType.Add, CollectionViewChangeType.Reorder]);
        });
        it('when remove item is removed.', function () {
            // Arrange.
            let o = new ObservableKeyArray(x => x);
            let cv = new CollectionView(o);
            o.add(1);
            let callbackFiredCount = 0;
            cv.subscribe(() => callbackFiredCount++);
            // Act.
            o.remove(1);
            // Assert.
            strict.deepEqual([...cv.values], []);
            strict.equal(callbackFiredCount, 1);
        });
        it('when remove and collectionView is sorted reorder is not raised.', function () {
            // Arrange.
            let o = new ObservableKeyArray(x => x);
            let cv = new CollectionView(o);
            o.add(1, 2, 3);
            cv.sortBy({ ascendingComparator: (a, b) => a - b });
            let raisedEvents = [];
            cv.subscribe((event) => raisedEvents.push(event.type));
            // Act.
            o.remove(2);
            // Assert.
            let one = cv.getBoxByKey(1);
            let three = cv.getBoxByKey(3);
            strict.deepEqual([...cv.values], [one, three]);
            strict.deepEqual(raisedEvents, [CollectionViewChangeType.Remove]);
        });
        it('when remove items are removed.', function () {
            // Arrange.
            let o = new ObservableKeyArray(x => x);
            let cv = new CollectionView(o);
            o.add(1, 2, 3);
            let callbackFiredCount = 0;
            cv.subscribe(() => callbackFiredCount++);
            // Act.
            o.remove(1, 3);
            // Assert.
            let two = cv.getBoxByKey(2);
            strict.deepEqual([...cv.values], [two]);
            strict.equal(callbackFiredCount, 1);
        });
    });
    describe('sorting', function () {
        it('when sort changes should reorder items.', function () {
            // Arrange.
            let o = new ObservableKeyArray(x => x);
            let cv = new CollectionView(o);
            o.add(3, 2, 1);
            let callbackFiredCount = 0;
            cv.sortChanged(event => callbackFiredCount++);
            // Act.
            cv.sortBy({ ascendingComparator: (a, b) => a - b });
            // Assert.
            let one = cv.getBoxByKey(1);
            let two = cv.getBoxByKey(2);
            let three = cv.getBoxByKey(3);
            strict.deepEqual([...cv.values], [one, two, three]);
            strict.equal(callbackFiredCount, 1);
        });
        it('added items should be sorted.', function () {
            // Arrange.
            let o = new ObservableKeyArray(x => x);
            let cv = new CollectionView(o);
            cv.sortBy({ ascendingComparator: (a, b) => a - b });
            let raisedEvents = [];
            cv.subscribe((event) => raisedEvents.push(event.type));
            // Act.
            o.add(3, 2, 1);
            // Assert.
            let one = cv.getBoxByKey(1);
            let two = cv.getBoxByKey(2);
            let three = cv.getBoxByKey(3);
            strict.deepEqual([...cv.values], [one, two, three]);
            strict.deepEqual(raisedEvents, [CollectionViewChangeType.Add, CollectionViewChangeType.Reorder]);
        });
    });
});
//# sourceMappingURL=collectionView.spec.js.map