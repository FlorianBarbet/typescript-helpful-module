import "reflect-metadata";

const schemeRegistry = Symbol.for("scheme:registry");
export function DefaultScheme(value: any) {
    return function(target: any, propertyKey: string | symbol, parameterIndex: number) {
        const valueSchemeRegistry = Reflect.getOwnMetadata(schemeRegistry, target, propertyKey) || {};
        const propertyValueSchemeRegistry = (valueSchemeRegistry[propertyKey] ??= []);
        propertyValueSchemeRegistry[parameterIndex] = value;
        Reflect.defineMetadata(schemeRegistry, valueSchemeRegistry, target, propertyKey);
    };
}

export function EnableDefaultInput() {
    return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const orig = descriptor.value;
        descriptor.value = function(...args: any[]) {
            const valueSchemeRegistry = Reflect.getOwnMetadata(schemeRegistry, target, propertyName);
            const defaultParams = valueSchemeRegistry?.[propertyName] || [];

            defaultParams.forEach((paramDefaultValue: any, index: number) => {
                if (typeof paramDefaultValue !== "object") {
                    args[index] ??= paramDefaultValue;
                    return;
                }

                flatPath(paramDefaultValue).forEach(path => {
                    const lastDelimiterIndex = path.lastIndexOf(".");
                    let key = path;
                    let parameter = args[index];

                    if (lastDelimiterIndex > 0) {
                        key = path.substring(lastDelimiterIndex+1);
                        parameter = lookup(path.substring(0, lastDelimiterIndex), parameter);
                    }

                    const defaultValue = lookup(path, paramDefaultValue);

                    if (!parameter?.hasOwnProperty(key)) {
                        parameter[key] ??= defaultValue;
                    }
                });
            });
            return orig.apply(this, args);
        };
    };
}

/**
 * Get value from path of json object
 * @param path the path you're looking for a value (e.g: "a.b.c")
 * @param json the json object to inspect (e.g: {a:{b:{c:1}}})
 * @return the value of the path you've looking for (e.g: json={a:{b:{c:1}}}, path="a.b.c", result=1)
 */
function lookup(path: string, json: any): any {
    return path.split(".")
        .reduce((jsonObject, prop) => jsonObject[prop] ??= {}, json);
}

/**
 * Get full path array from a JSON (non-terminal recursive to avoid double registration)
 * @param json the json where we want to extract full path
 * @return an array of the path of json (e.g: json={a:1, b:1, c:{ d:1, e:1 }}, result=["a","b","c.d","c.e"]
 */
function flatPath(json: any): string[] {
    const applyParent = (parent: string, childrens: string[]) => {
        return childrens
            .map(child => `${parent}.${child}`);
    };

    return Object.keys(json)
        .flatMap(key => {
            const value = json[key];
            if (!value || typeof value !== "object") {
                return key;
            }
            return applyParent(key, flatPath(value));
        }).toString().split(",");
}