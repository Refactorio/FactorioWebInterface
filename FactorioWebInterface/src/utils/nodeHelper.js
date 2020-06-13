export class NodeHelper {
    static getByInstanceOfInner(node, type, output) {
        if (node instanceof type) {
            output.push(node);
        }
        for (let child of node.childNodes) {
            NodeHelper.getByInstanceOfInner(child, type, output);
        }
    }
    static getByInstanceOf(node, type) {
        let output = [];
        this.getByInstanceOfInner(node, type, output);
        return output;
    }
    static getNode(value) {
        if (value instanceof Node) {
            return value;
        }
        return document.createTextNode(value);
    }
}
//# sourceMappingURL=nodeHelper.js.map