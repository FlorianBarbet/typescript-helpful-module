import * as chai from "chai";
import "reflect-metadata";
import { DefaultScheme, EnableDefaultInput } from "../src";

describe("DefaultInput", () => {
    class TestCase {
        @EnableDefaultInput()
        static simpleCase(name: string, @DefaultScheme({ bar: "hello world" }) foo: {[name: string]: string}) {
            return foo;
        }

        @EnableDefaultInput()
        static noValueCase(name: string | undefined) {
            return name;
        }

        @EnableDefaultInput()
        static multipleArgsDefaultCase(@DefaultScheme("Balavoine") name: string | undefined,
                                       @DefaultScheme({ bar: "hello world" }) foo: {[name: string]: string},
                                       @DefaultScheme({ artist: "Daniel" }) henry: {[name: string]: string}) {
            return [name, foo, henry];
        }

        @EnableDefaultInput()
        static multipleChildAtRootCase(name: string, @DefaultScheme({ foo: "we are champ", bar: "hello world" }) foo: {[name: string]: string}) {
            return foo;
        }

        @EnableDefaultInput()
        static deepCase(name: string, @DefaultScheme({ foo: { bar: { options: { levitate: true }, value: "my world" } } }) foo: any) {
            return foo;
        }
    }


    describe("decorator DefaultScheme", () => {
         it("should store scheme into registry in the metadata", () => {
             const metadataIdentifier = Symbol.for("scheme:registry");
             chai.expect(metadataIdentifier).to.not.be.undefined; // we can find the symbol into the symbol registry

             const valueSchemeRegistry = Reflect.getOwnMetadata(metadataIdentifier, TestCase, "simpleCase");

             const expectedContent: any[] = [];
             expectedContent[1] = { bar: "hello world" }; // index is the position of the args

             chai.expect(valueSchemeRegistry).to.be.deep.equals({ simpleCase: expectedContent });
         });
    });

    describe("decorator DefaultInput", () => {

        it("should add default value if they aren't provided", () => {
            chai.expect(TestCase.simpleCase("henry", {}))
                .to.be.deep.equals({ bar: "hello world" });
        });

        it("should not affect the function if no scheme is specified", () => {
            chai.expect(TestCase.noValueCase(undefined))
                .to.be.undefined;
        });

        it("should add default value if they aren't provided even if multiple childs at root", () => {
            chai.expect(TestCase.multipleChildAtRootCase("henry", {}))
                .to.be.deep.equals({ foo: "we are champ", bar: "hello world" });
        });

        it("should add default value if they aren't provided deeply", () => {
            chai.expect(TestCase.deepCase("henry", {}))
                .to.be.deep.equals({ foo: { bar: { options: { levitate: true }, value: "my world" } } });
        });

        it("should add default value if they aren't provided and don't change the others fields", () => {
            chai.expect(TestCase.simpleCase("henry", { harry: "WIZARD" }))
                .to.be.deep.equals({ bar: "hello world", harry: "WIZARD" });
        });

        it("should add default value if they aren't provided and don't change the others fields multiple root", () => {
            chai.expect(TestCase.multipleChildAtRootCase("henry", { harry: "WIZARD" }))
                .to.be.deep.equals({ foo: "we are champ", harry: "WIZARD", bar: "hello world" });
        });

        it("should add default value if they aren't provided and don't change the others fields deeply", () => {
            chai.expect(TestCase.deepCase("henry", { foo: { bar: { options: { alert: false } }, metadata: "not useful" } }))
                .to.be.deep.equals({ foo: { bar: { options: { levitate: true, alert: false }, value: "my world" }, metadata: "not useful" } });
        });

        it("should do nothing if the parameter with default value is set", () => {
            chai.expect(TestCase.simpleCase("henry", { bar: "hello HENRY" }))
                .to.be.deep.equals({ bar: "hello HENRY" });
        });

        it("should do nothing if a parameter with default value is already set multiple root", () => {
            chai.expect(TestCase.multipleChildAtRootCase("henry", { foo: "WE ARE HERE" }))
                .to.be.deep.equals({ foo: "WE ARE HERE", bar: "hello world" });
        });

        it("should do nothing if a parameter with value is already set deeply", () => {
            chai.expect(TestCase.deepCase("henry", { foo: { bar: { options: { levitate: false } } } }))
                .to.be.deep.equals({ foo: { bar: { options: { levitate: false }, value: "my world" } } });
        });

        it("should permit to default multiple arguments", () => {
            chai.expect(TestCase.multipleArgsDefaultCase(undefined, {}, {}))
                .to.be.deep.equals(["Balavoine", { bar: "hello world" }, { artist: "Daniel" }]);
        });

    });
});