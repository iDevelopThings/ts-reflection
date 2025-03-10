import * as ts                                    from "typescript";
import { VisitResult }                            from "typescript";
import type { MetadataEntry, TransformerVisitor } from "../declarations";
import { IMetadataWriter }                        from "../meta-writer/IMetadataWriter";
import SourceFileContext                          from "./SourceFileContext";

/**
 * Context of visitors
 */
export class Context
{
	private readonly _sourceFileContext: SourceFileContext;
	private readonly _visitor: ts.Visitor;
	private readonly _transformerVisitor: TransformerVisitor;

	/**
	 * When visiting declaration bodies, names of generic types used in getType() are inserted into this array.
	 */
	public usedGenericParameters: Array<string> = [];

	get log()
	{
		return this._sourceFileContext.log;
	}
	
	get config()
	{
		return this._sourceFileContext.transformerContext.config;
	}

	get visitor(): ts.Visitor
	{
		return this._visitor;
	}

	get transformationContext(): ts.TransformationContext
	{
		return this._sourceFileContext.transformationContext;
	}

	get typeChecker(): ts.TypeChecker
	{
		return this._sourceFileContext.checker;
	}

	constructor(sourceFileContext: SourceFileContext, visitor: TransformerVisitor)
	{
		this._sourceFileContext = sourceFileContext;
		this._transformerVisitor = visitor;
		this._visitor = (node: ts.Node) => visitor(node, this);
	}

	visit(node: ts.Node): VisitResult<ts.Node>
	{
		return this.visitor(node);
	}

	addTypeMetadata(metadataEntry: MetadataEntry)
	{
		this._sourceFileContext.typesMetadata.push(metadataEntry);
	}

	addTypeCtor(ctorDescription: ts.PropertyAccessExpression)
	{
		if (this._sourceFileContext.typesCtors.indexOf(ctorDescription) === -1)
		{
			this._sourceFileContext.typesCtors.push(ctorDescription);
		}
	}

	visitFunctionLikeDeclaration(node: ts.FunctionLikeDeclarationBase): void
	{
		ts.visitEachChild(node, this.visitor, this._sourceFileContext.transformationContext);
	}

	createNestedContext<TReturn = undefined>(visitor: TransformerVisitor, contextAction: (context: Context) => TReturn)
	{
		const context = new Context(this._sourceFileContext, visitor);
		return contextAction(context);
	}

	get currentSourceFile(): ts.SourceFile
	{
		return this._sourceFileContext.currentSourceFile;
	}

	/**
	 * Get the metadata library writer handler
	 */
	get metaWriter(): IMetadataWriter
	{
		return this._sourceFileContext.metaWriter;
	}
}
