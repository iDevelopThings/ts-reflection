import {
	MetadataType,
	MetadataTypeValues
}                                      from "../../config-options";
import TransformerContext              from "../../contexts/TransformerContext";
import {
	getRequireRelativePath,
	hasRuntimePackageImport
}                                      from "../../helpers";
import { MetadataTransformerFactory }  from "../factories/MetadataTransformerFactory";
import { MetadataWriterBase }          from "../MetadataWriterBase";
import { InlineMetadataTransformer }   from "./InlineMetadataTransformer";
import { InlineMetadataNodeGenerator } from "./InlineMetadataNodeGenerator";
import * as ts                         from "typescript";
import { Context }                     from "contexts/Context";

export class InlineMetadataWriter extends MetadataWriterBase
{
	protected type: MetadataType = MetadataTypeValues.inline;

	constructor(metadataFilePath: string, context: TransformerContext)
	{
		super(
			metadataFilePath,
			context,
			new InlineMetadataNodeGenerator(),
			new MetadataTransformerFactory(InlineMetadataTransformer),
			ts.factory.createIdentifier("____tst_reflect_set"), // TODO: It differ from TypeLib identifier name; is there any reason?
			ts.factory.createIdentifier("____tst_reflect_set"), // TODO: Should it be same instance of identifier? I suppose to.

		);

		this.createBaseMeta();
	}

	/**
	 * Does this meta writer use a stub file?
	 *
	 * For example,
	 * ts version uses a file with pre-made store etc.
	 * js version is generated on the fly
	 * inline doesn't use one
	 *
	 * If it uses a stub file, we return [yes, stub file name]
	 * If not, [no, undefined]
	 *
	 * @returns {[boolean, string|undefined]}
	 */
	usesStubFile(): [boolean, string | undefined]
	{
		return [false, undefined];
	}

	/**
	 * With inline, we're just going to try and import the reflect package where ever we need it
	 *
	 * If we already have the import... and it's only getType, we'll just remove that import.
	 * I don't think it matters too much though
	 *
	 * @param {ts.SourceFile} sourceFile
	 * @returns {ts.SourceFile}
	 */
	addLibImportToSourceFile(sourceFile: ts.SourceFile): ts.SourceFile
	{
		if (this.hasAddedMetaLibImport(sourceFile.fileName))
		{
			return sourceFile;
		}

		const [has, namedImports, getTypeImportNodePos] = hasRuntimePackageImport(sourceFile);

		let newStatements = [...sourceFile.statements];

		// If we have the import already and it's only "getType", lets just yeet it
		if (has && getTypeImportNodePos !== -1)
		{
			newStatements = sourceFile.statements.filter(n => n.pos !== getTypeImportNodePos);
		}

		this.logMessage(`Added lib import to source file: ${sourceFile.fileName}`);

		this.addedMetaLibImport(sourceFile.fileName);

		return ts.factory.updateSourceFile(sourceFile, [
			...this.metadataNodeGenerator.sourceFileMetaLibStatements(),
			...newStatements
		]);
	}

	/**
	 * @inheritDoc
	 */
	getRequireRelativePath(context: Context, filePath: string): string
	{
		return getRequireRelativePath(context.currentSourceFile.fileName, filePath);
	}
}
